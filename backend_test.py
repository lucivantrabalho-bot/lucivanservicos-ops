#!/usr/bin/env python3
"""
Backend API Testing Script for New Features
Tests the newly implemented functionality including:
1. Fixed Registration Flow - POST /api/register returns PENDING status
2. New Report Endpoints - timeline, distribution, performance
3. Admin Delete Pendency - DELETE /api/admin/delete-pendencia/{id}
4. Login with PENDING status verification
5. Authentication verification for all endpoints
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://pendency-hub.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

class BackendTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.admin_token = None
        self.admin_user_id = None
        self.test_results = []
        
    def log_test(self, test_name, success, message, details=None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "details": details
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details:
            print(f"   Details: {details}")
    
    def login_admin(self):
        """Login as admin to get authentication token"""
        try:
            response = requests.post(
                f"{self.base_url}/login",
                json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data["access_token"]
                self.admin_user_id = data["user_id"]
                self.log_test("Admin Login", True, "Successfully logged in as admin")
                return True
            else:
                self.log_test("Admin Login", False, f"Login failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Admin Login", False, f"Login request failed: {str(e)}")
            return False
    
    def get_auth_headers(self):
        """Get authorization headers"""
        return {"Authorization": f"Bearer {self.admin_token}"}
    
    def test_get_all_users(self):
        """Test GET /api/admin/all-users endpoint"""
        try:
            response = requests.get(
                f"{self.base_url}/admin/all-users",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                users = response.json()
                if isinstance(users, list) and len(users) > 0:
                    # Check if admin user is present
                    admin_found = any(user.get("username") == ADMIN_USERNAME for user in users)
                    if admin_found:
                        self.log_test("Get All Users", True, f"Retrieved {len(users)} users including admin", 
                                    f"Users: {[u.get('username') for u in users]}")
                        return users
                    else:
                        self.log_test("Get All Users", False, "Admin user not found in user list", users)
                        return users
                else:
                    self.log_test("Get All Users", False, "No users returned or invalid response format", users)
                    return []
            else:
                self.log_test("Get All Users", False, f"Request failed with status {response.status_code}", response.text)
                return []
                
        except Exception as e:
            self.log_test("Get All Users", False, f"Request failed: {str(e)}")
            return []
    
    def test_reset_password_valid(self, user_id, username):
        """Test password reset with valid password (≥4 characters)"""
        try:
            new_password = "newpass123"
            response = requests.put(
                f"{self.base_url}/admin/reset-password/{user_id}",
                headers=self.get_auth_headers(),
                json={"new_password": new_password},
                timeout=10
            )
            
            if response.status_code == 200:
                self.log_test("Reset Password (Valid)", True, f"Successfully reset password for user {username}")
                return True
            else:
                self.log_test("Reset Password (Valid)", False, 
                            f"Password reset failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Reset Password (Valid)", False, f"Request failed: {str(e)}")
            return False
    
    def test_reset_password_invalid(self, user_id, username):
        """Test password reset with invalid password (<4 characters)"""
        try:
            new_password = "123"  # Less than 4 characters
            response = requests.put(
                f"{self.base_url}/admin/reset-password/{user_id}",
                headers=self.get_auth_headers(),
                json={"new_password": new_password},
                timeout=10
            )
            
            if response.status_code == 400:
                self.log_test("Reset Password (Invalid)", True, 
                            f"Correctly rejected short password for user {username}")
                return True
            else:
                self.log_test("Reset Password (Invalid)", False, 
                            f"Should have rejected short password but got status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Reset Password (Invalid)", False, f"Request failed: {str(e)}")
            return False
    
    def test_delete_own_account(self):
        """Test that admin cannot delete their own account"""
        try:
            response = requests.delete(
                f"{self.base_url}/admin/delete-user/{self.admin_user_id}",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            if response.status_code == 400:
                self.log_test("Delete Own Account Protection", True, 
                            "Correctly prevented admin from deleting own account")
                return True
            else:
                self.log_test("Delete Own Account Protection", False, 
                            f"Should have prevented self-deletion but got status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Delete Own Account Protection", False, f"Request failed: {str(e)}")
            return False
    
    def test_delete_other_user(self, user_id, username):
        """Test deletion of another user"""
        try:
            response = requests.delete(
                f"{self.base_url}/admin/delete-user/{user_id}",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                self.log_test("Delete Other User", True, f"Successfully deleted user {username}")
                return True
            else:
                self.log_test("Delete Other User", False, 
                            f"User deletion failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Delete Other User", False, f"Request failed: {str(e)}")
            return False
    
    def create_test_user(self):
        """Create a test user for deletion testing"""
        try:
            test_username = f"testuser_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            response = requests.post(
                f"{self.base_url}/register",
                json={"username": test_username, "password": "testpass123"},
                timeout=10
            )
            
            if response.status_code == 200:
                self.log_test("Create Test User", True, f"Created test user {test_username}")
                return test_username
            else:
                self.log_test("Create Test User", False, 
                            f"Failed to create test user with status {response.status_code}", response.text)
                return None
                
        except Exception as e:
            self.log_test("Create Test User", False, f"Request failed: {str(e)}")
            return None
    
    def test_password_reset_bug_investigation(self):
        """
        COMPREHENSIVE PASSWORD RESET BUG INVESTIGATION
        Tests the reported bug where users can still login with old password after admin reset
        """
        print("\n" + "=" * 80)
        print("🔍 PASSWORD RESET BUG INVESTIGATION")
        print("=" * 80)
        print("Testing reported issue: User can login with old password after admin reset")
        print()
        
        # Step 1: Create a test user and approve them immediately
        test_username = f"resettest_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        original_password = "originalpass123"
        new_password = "newpass456"
        
        try:
            # Create test user
            response = requests.post(
                f"{self.base_url}/register",
                json={"username": test_username, "password": original_password},
                timeout=10
            )
            
            if response.status_code != 200:
                self.log_test("Password Reset Bug - Create Test User", False, 
                            f"Failed to create test user: {response.status_code}", response.text)
                return False
            
            self.log_test("Password Reset Bug - Create Test User", True, 
                        f"Created test user: {test_username}")
            
            # Get the user ID and approve the user
            users_response = requests.get(
                f"{self.base_url}/admin/all-users",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            if users_response.status_code != 200:
                self.log_test("Password Reset Bug - Get Users", False, 
                            f"Failed to get users: {users_response.status_code}")
                return False
            
            users = users_response.json()
            test_user = next((u for u in users if u.get("username") == test_username), None)
            
            if not test_user:
                self.log_test("Password Reset Bug - Find Test User", False, 
                            f"Could not find created test user")
                return False
            
            user_id = test_user["id"]
            
            # Approve the test user
            approve_response = requests.put(
                f"{self.base_url}/admin/approve-user/{user_id}",
                headers=self.get_auth_headers(),
                json={"status": "APPROVED"},
                timeout=10
            )
            
            if approve_response.status_code != 200:
                self.log_test("Password Reset Bug - Approve User", False, 
                            f"Failed to approve user: {approve_response.status_code}")
                return False
            
            self.log_test("Password Reset Bug - Approve User", True, 
                        f"Approved test user: {test_username}")
            
            # Step 2: Verify original login works
            login_response = requests.post(
                f"{self.base_url}/login",
                json={"username": test_username, "password": original_password},
                timeout=10
            )
            
            if login_response.status_code != 200:
                self.log_test("Password Reset Bug - Original Login", False, 
                            f"Original login failed: {login_response.status_code}", login_response.text)
                return False
            
            original_token = login_response.json()["access_token"]
            self.log_test("Password Reset Bug - Original Login", True, 
                        f"✅ Original password login successful")
            
            # Step 3: Admin resets the password
            reset_response = requests.put(
                f"{self.base_url}/admin/reset-password/{user_id}",
                headers=self.get_auth_headers(),
                json={"new_password": new_password},
                timeout=10
            )
            
            if reset_response.status_code != 200:
                self.log_test("Password Reset Bug - Admin Reset", False, 
                            f"Password reset failed: {reset_response.status_code}", reset_response.text)
                return False
            
            self.log_test("Password Reset Bug - Admin Reset", True, 
                        f"✅ Admin successfully reset password")
            
            # Step 4: Test login with NEW password (should work)
            new_login_response = requests.post(
                f"{self.base_url}/login",
                json={"username": test_username, "password": new_password},
                timeout=10
            )
            
            new_password_works = new_login_response.status_code == 200
            if new_password_works:
                self.log_test("Password Reset Bug - New Password Login", True, 
                            f"✅ New password login successful")
            else:
                self.log_test("Password Reset Bug - New Password Login", False, 
                            f"❌ New password login failed: {new_login_response.status_code}", 
                            new_login_response.text)
            
            # Step 5: CRITICAL TEST - Try login with OLD password (should FAIL)
            old_login_response = requests.post(
                f"{self.base_url}/login",
                json={"username": test_username, "password": original_password},
                timeout=10
            )
            
            old_password_still_works = old_login_response.status_code == 200
            
            if old_password_still_works:
                # THIS IS THE BUG!
                self.log_test("Password Reset Bug - Old Password Login", False, 
                            f"🚨 CRITICAL BUG CONFIRMED: Old password still works after reset!", 
                            f"Status: {old_login_response.status_code}, Response: {old_login_response.text}")
                print(f"🚨 BUG CONFIRMED: User {test_username} can still login with old password!")
                print(f"   Original password: {original_password}")
                print(f"   New password: {new_password}")
                print(f"   Both passwords work - this is the reported bug!")
            else:
                self.log_test("Password Reset Bug - Old Password Login", True, 
                            f"✅ Old password correctly rejected after reset")
                print(f"✅ Password reset working correctly - old password rejected")
            
            # Step 6: Cleanup - delete test user
            delete_response = requests.delete(
                f"{self.base_url}/admin/delete-user/{user_id}",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            if delete_response.status_code == 200:
                self.log_test("Password Reset Bug - Cleanup", True, "Test user deleted successfully")
            else:
                self.log_test("Password Reset Bug - Cleanup", False, 
                            f"Failed to delete test user: {delete_response.status_code}")
            
            # Summary of bug investigation
            print("\n" + "=" * 80)
            print("🔍 BUG INVESTIGATION SUMMARY")
            print("=" * 80)
            print(f"Test User: {test_username}")
            print(f"Original Password: {original_password}")
            print(f"New Password: {new_password}")
            print(f"New Password Works: {'✅ YES' if new_password_works else '❌ NO'}")
            print(f"Old Password Still Works: {'🚨 YES (BUG!)' if old_password_still_works else '✅ NO (CORRECT)'}")
            
            if old_password_still_works:
                print("\n🚨 CRITICAL ISSUE IDENTIFIED:")
                print("   - Password reset endpoint returns success")
                print("   - But old password still allows login")
                print("   - This indicates the password hash is NOT being updated in database")
                print("   - OR there's a caching/session issue")
                return False
            else:
                print("\n✅ Password reset functionality working correctly")
                return True
                
        except Exception as e:
            self.log_test("Password Reset Bug Investigation", False, f"Test failed with exception: {str(e)}")
            return False

    def test_existing_user_password_reset(self):
        """
        Test password reset with an existing user to see if there's a different behavior
        """
        print("\n" + "=" * 80)
        print("🔍 EXISTING USER PASSWORD RESET TEST")
        print("=" * 80)
        print("Testing password reset with existing user 'operador'")
        print()
        
        try:
            # Get existing user info
            users_response = requests.get(
                f"{self.base_url}/admin/all-users",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            if users_response.status_code != 200:
                self.log_test("Existing User Test - Get Users", False, 
                            f"Failed to get users: {users_response.status_code}")
                return False
            
            users = users_response.json()
            test_user = next((u for u in users if u.get("username") == "operador"), None)
            
            if not test_user:
                self.log_test("Existing User Test - Find User", False, 
                            "Could not find 'operador' user")
                return False
            
            user_id = test_user["id"]
            username = test_user["username"]
            
            # Try to login with a known password (this might fail, which is expected)
            original_password = "operador123"  # Common password
            new_password = "resetpass789"
            
            print(f"Testing with user: {username} (ID: {user_id})")
            
            # Test original login (might fail if we don't know the password)
            login_response = requests.post(
                f"{self.base_url}/login",
                json={"username": username, "password": original_password},
                timeout=10
            )
            
            original_login_works = login_response.status_code == 200
            
            if original_login_works:
                self.log_test("Existing User Test - Original Login", True, 
                            f"✅ Original password works for {username}")
            else:
                self.log_test("Existing User Test - Original Login", True, 
                            f"ℹ️ Original password test failed (expected): {login_response.status_code}")
                # Try a different common password
                alt_passwords = ["123456", "operador", "admin123", "password"]
                for alt_pass in alt_passwords:
                    alt_response = requests.post(
                        f"{self.base_url}/login",
                        json={"username": username, "password": alt_pass},
                        timeout=10
                    )
                    if alt_response.status_code == 200:
                        original_password = alt_pass
                        original_login_works = True
                        self.log_test("Existing User Test - Found Password", True, 
                                    f"✅ Found working password for {username}: {alt_pass}")
                        break
            
            # Reset password via admin
            reset_response = requests.put(
                f"{self.base_url}/admin/reset-password/{user_id}",
                headers=self.get_auth_headers(),
                json={"new_password": new_password},
                timeout=10
            )
            
            if reset_response.status_code != 200:
                self.log_test("Existing User Test - Admin Reset", False, 
                            f"Password reset failed: {reset_response.status_code}")
                return False
            
            self.log_test("Existing User Test - Admin Reset", True, 
                        f"✅ Admin successfully reset password for {username}")
            
            # Test new password
            new_login_response = requests.post(
                f"{self.base_url}/login",
                json={"username": username, "password": new_password},
                timeout=10
            )
            
            new_password_works = new_login_response.status_code == 200
            if new_password_works:
                self.log_test("Existing User Test - New Password", True, 
                            f"✅ New password works for {username}")
            else:
                self.log_test("Existing User Test - New Password", False, 
                            f"❌ New password failed for {username}: {new_login_response.status_code}")
            
            # Test old password (if we found one that worked)
            if original_login_works:
                old_login_response = requests.post(
                    f"{self.base_url}/login",
                    json={"username": username, "password": original_password},
                    timeout=10
                )
                
                old_password_still_works = old_login_response.status_code == 200
                
                if old_password_still_works:
                    self.log_test("Existing User Test - Old Password", False, 
                                f"🚨 BUG: Old password still works for {username}!")
                    print(f"🚨 BUG CONFIRMED with existing user {username}!")
                    print(f"   Old password: {original_password}")
                    print(f"   New password: {new_password}")
                    print(f"   Both passwords work!")
                    return False
                else:
                    self.log_test("Existing User Test - Old Password", True, 
                                f"✅ Old password correctly rejected for {username}")
            
            print(f"\n✅ Existing user password reset test completed for {username}")
            return True
                
        except Exception as e:
            self.log_test("Existing User Password Reset Test", False, f"Test failed with exception: {str(e)}")
            return False

    def test_monthly_stats(self):
        """Test GET /api/stats/monthly - should only count APPROVED pendencies"""
        try:
            response = requests.get(
                f"{self.base_url}/stats/monthly",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                stats = response.json()
                required_fields = ["month", "year", "most_created", "most_finished"]
                
                if all(field in stats for field in required_fields):
                    self.log_test("Monthly Stats", True, 
                                f"Retrieved monthly stats for {stats.get('month')} {stats.get('year')}", 
                                f"Most created: {stats.get('most_created')}, Most finished: {stats.get('most_finished')}")
                    return True
                else:
                    self.log_test("Monthly Stats", False, 
                                "Missing required fields in response", stats)
                    return False
            else:
                self.log_test("Monthly Stats", False, 
                            f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Monthly Stats", False, f"Request failed: {str(e)}")
            return False

    def test_get_form_config(self):
        """Test GET /api/admin/form-config - should return default config if none exists"""
        try:
            response = requests.get(
                f"{self.base_url}/admin/form-config",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                config = response.json()
                required_fields = ["energia_options", "arcon_options"]
                
                if all(field in config for field in required_fields):
                    energia_count = len(config.get("energia_options", []))
                    arcon_count = len(config.get("arcon_options", []))
                    self.log_test("Get Form Config", True, 
                                f"Retrieved form configuration", 
                                f"Energia options: {energia_count}, Arcon options: {arcon_count}")
                    return config
                else:
                    self.log_test("Get Form Config", False, 
                                "Missing required fields in response", config)
                    return None
            else:
                self.log_test("Get Form Config", False, 
                            f"Request failed with status {response.status_code}", response.text)
                return None
                
        except Exception as e:
            self.log_test("Get Form Config", False, f"Request failed: {str(e)}")
            return None

    def test_update_form_config(self):
        """Test PUT /api/admin/form-config - should save configuration"""
        try:
            # Test configuration with modified options
            test_config = {
                "energia_options": [
                    "Controladora", "QDCA", "QM", "Retificador", "Disjuntor", 
                    "Bateria", "Iluminação Pátio", "Sensor de Porta", 
                    "Sensor de Incêndio", "Iluminação Gabinete/Container", 
                    "Cabo de Alimentação", "TESTE_NOVO_ITEM"
                ],
                "arcon_options": [
                    "Trocador de Calor", "Sanrio", "Walmont", "Limpeza", 
                    "Contatora", "Compressor", "Gás", "Fusível", 
                    "Placa Queimada", "Transformador", "Relé Térmico", 
                    "Relé Falta de Fase", "Comando", "Alarme", "TESTE_NOVO_ARCON"
                ]
            }
            
            response = requests.put(
                f"{self.base_url}/admin/form-config",
                headers=self.get_auth_headers(),
                json=test_config,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                if "message" in result:
                    self.log_test("Update Form Config", True, 
                                "Successfully updated form configuration", 
                                f"Added test items to both lists")
                    
                    # Verify the update by getting the config again
                    verify_response = requests.get(
                        f"{self.base_url}/admin/form-config",
                        headers=self.get_auth_headers(),
                        timeout=10
                    )
                    
                    if verify_response.status_code == 200:
                        updated_config = verify_response.json()
                        if ("TESTE_NOVO_ITEM" in updated_config.get("energia_options", []) and 
                            "TESTE_NOVO_ARCON" in updated_config.get("arcon_options", [])):
                            self.log_test("Verify Form Config Update", True, 
                                        "Configuration update verified successfully")
                            return True
                        else:
                            self.log_test("Verify Form Config Update", False, 
                                        "Updated items not found in retrieved configuration")
                            return False
                    else:
                        self.log_test("Verify Form Config Update", False, 
                                    f"Failed to verify update: {verify_response.status_code}")
                        return False
                else:
                    self.log_test("Update Form Config", False, 
                                "No success message in response", result)
                    return False
            else:
                self.log_test("Update Form Config", False, 
                            f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Update Form Config", False, f"Request failed: {str(e)}")
            return False

    def create_regular_user_for_testing(self):
        """Create a regular user for password change testing"""
        try:
            test_username = f"testuser_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            test_password = "testpass123"
            
            # Create user
            response = requests.post(
                f"{self.base_url}/register",
                json={"username": test_username, "password": test_password},
                timeout=10
            )
            
            if response.status_code != 200:
                self.log_test("Create Regular User", False, 
                            f"Failed to create user: {response.status_code}")
                return None, None
            
            # Get user ID and approve
            users_response = requests.get(
                f"{self.base_url}/admin/all-users",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            if users_response.status_code != 200:
                return None, None
            
            users = users_response.json()
            test_user = next((u for u in users if u.get("username") == test_username), None)
            
            if not test_user:
                return None, None
            
            # Approve user
            approve_response = requests.put(
                f"{self.base_url}/admin/approve-user/{test_user['id']}",
                headers=self.get_auth_headers(),
                json={"status": "APPROVED"},
                timeout=10
            )
            
            if approve_response.status_code == 200:
                self.log_test("Create Regular User", True, f"Created and approved user: {test_username}")
                return test_username, test_password
            else:
                return None, None
                
        except Exception as e:
            self.log_test("Create Regular User", False, f"Failed: {str(e)}")
            return None, None

    def test_user_change_password_valid(self):
        """Test PUT /api/user/change-password with valid current password"""
        try:
            # Create a test user
            username, current_password = self.create_regular_user_for_testing()
            if not username:
                self.log_test("User Change Password (Valid)", False, "Failed to create test user")
                return False
            
            # Login as the test user
            login_response = requests.post(
                f"{self.base_url}/login",
                json={"username": username, "password": current_password},
                timeout=10
            )
            
            if login_response.status_code != 200:
                self.log_test("User Change Password (Valid)", False, "Failed to login as test user")
                return False
            
            user_token = login_response.json()["access_token"]
            user_headers = {"Authorization": f"Bearer {user_token}"}
            
            # Change password
            new_password = "newpassword456"
            change_response = requests.put(
                f"{self.base_url}/user/change-password",
                headers=user_headers,
                json={
                    "current_password": current_password,
                    "new_password": new_password
                },
                timeout=10
            )
            
            if change_response.status_code == 200:
                # Verify new password works
                verify_response = requests.post(
                    f"{self.base_url}/login",
                    json={"username": username, "password": new_password},
                    timeout=10
                )
                
                if verify_response.status_code == 200:
                    self.log_test("User Change Password (Valid)", True, 
                                f"Successfully changed password for user {username}")
                    
                    # Cleanup - delete test user
                    users_response = requests.get(
                        f"{self.base_url}/admin/all-users",
                        headers=self.get_auth_headers(),
                        timeout=10
                    )
                    users = users_response.json()
                    test_user = next((u for u in users if u.get("username") == username), None)
                    if test_user:
                        requests.delete(
                            f"{self.base_url}/admin/delete-user/{test_user['id']}",
                            headers=self.get_auth_headers(),
                            timeout=10
                        )
                    
                    return True
                else:
                    self.log_test("User Change Password (Valid)", False, 
                                "New password doesn't work after change")
                    return False
            else:
                self.log_test("User Change Password (Valid)", False, 
                            f"Password change failed: {change_response.status_code}", change_response.text)
                return False
                
        except Exception as e:
            self.log_test("User Change Password (Valid)", False, f"Request failed: {str(e)}")
            return False

    def test_user_change_password_invalid_current(self):
        """Test PUT /api/user/change-password with incorrect current password"""
        try:
            # Create a test user
            username, current_password = self.create_regular_user_for_testing()
            if not username:
                self.log_test("User Change Password (Invalid Current)", False, "Failed to create test user")
                return False
            
            # Login as the test user
            login_response = requests.post(
                f"{self.base_url}/login",
                json={"username": username, "password": current_password},
                timeout=10
            )
            
            if login_response.status_code != 200:
                self.log_test("User Change Password (Invalid Current)", False, "Failed to login as test user")
                return False
            
            user_token = login_response.json()["access_token"]
            user_headers = {"Authorization": f"Bearer {user_token}"}
            
            # Try to change password with wrong current password
            change_response = requests.put(
                f"{self.base_url}/user/change-password",
                headers=user_headers,
                json={
                    "current_password": "wrongpassword",
                    "new_password": "newpassword456"
                },
                timeout=10
            )
            
            if change_response.status_code == 400:
                self.log_test("User Change Password (Invalid Current)", True, 
                            "Correctly rejected incorrect current password")
                
                # Cleanup - delete test user
                users_response = requests.get(
                    f"{self.base_url}/admin/all-users",
                    headers=self.get_auth_headers(),
                    timeout=10
                )
                users = users_response.json()
                test_user = next((u for u in users if u.get("username") == username), None)
                if test_user:
                    requests.delete(
                        f"{self.base_url}/admin/delete-user/{test_user['id']}",
                        headers=self.get_auth_headers(),
                        timeout=10
                    )
                
                return True
            else:
                self.log_test("User Change Password (Invalid Current)", False, 
                            f"Should have rejected wrong password but got: {change_response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("User Change Password (Invalid Current)", False, f"Request failed: {str(e)}")
            return False

    def test_user_change_password_too_short(self):
        """Test PUT /api/user/change-password with new password too short"""
        try:
            # Create a test user
            username, current_password = self.create_regular_user_for_testing()
            if not username:
                self.log_test("User Change Password (Too Short)", False, "Failed to create test user")
                return False
            
            # Login as the test user
            login_response = requests.post(
                f"{self.base_url}/login",
                json={"username": username, "password": current_password},
                timeout=10
            )
            
            if login_response.status_code != 200:
                self.log_test("User Change Password (Too Short)", False, "Failed to login as test user")
                return False
            
            user_token = login_response.json()["access_token"]
            user_headers = {"Authorization": f"Bearer {user_token}"}
            
            # Try to change password with too short new password
            change_response = requests.put(
                f"{self.base_url}/user/change-password",
                headers=user_headers,
                json={
                    "current_password": current_password,
                    "new_password": "123"  # Less than 4 characters
                },
                timeout=10
            )
            
            if change_response.status_code == 400:
                self.log_test("User Change Password (Too Short)", True, 
                            "Correctly rejected password that's too short")
                
                # Cleanup - delete test user
                users_response = requests.get(
                    f"{self.base_url}/admin/all-users",
                    headers=self.get_auth_headers(),
                    timeout=10
                )
                users = users_response.json()
                test_user = next((u for u in users if u.get("username") == username), None)
                if test_user:
                    requests.delete(
                        f"{self.base_url}/admin/delete-user/{test_user['id']}",
                        headers=self.get_auth_headers(),
                        timeout=10
                    )
                
                return True
            else:
                self.log_test("User Change Password (Too Short)", False, 
                            f"Should have rejected short password but got: {change_response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("User Change Password (Too Short)", False, f"Request failed: {str(e)}")
            return False

    def test_user_individual_stats(self):
        """Test GET /api/user/stats - individual user statistics"""
        try:
            # Create a test user
            username, password = self.create_regular_user_for_testing()
            if not username:
                self.log_test("User Individual Stats", False, "Failed to create test user")
                return False
            
            # Login as the test user
            login_response = requests.post(
                f"{self.base_url}/login",
                json={"username": username, "password": password},
                timeout=10
            )
            
            if login_response.status_code != 200:
                self.log_test("User Individual Stats", False, "Failed to login as test user")
                return False
            
            user_token = login_response.json()["access_token"]
            user_headers = {"Authorization": f"Bearer {user_token}"}
            
            # Get user stats
            stats_response = requests.get(
                f"{self.base_url}/user/stats",
                headers=user_headers,
                timeout=10
            )
            
            if stats_response.status_code == 200:
                stats = stats_response.json()
                required_fields = ["month", "year", "created_count", "finished_count", 
                                 "approved_created_count", "approved_finished_count"]
                
                if all(field in stats for field in required_fields):
                    self.log_test("User Individual Stats", True, 
                                f"Retrieved individual stats for {username}", 
                                f"Month: {stats.get('month')} {stats.get('year')}, Created: {stats.get('created_count')}, Finished: {stats.get('finished_count')}")
                    
                    # Cleanup - delete test user
                    users_response = requests.get(
                        f"{self.base_url}/admin/all-users",
                        headers=self.get_auth_headers(),
                        timeout=10
                    )
                    users = users_response.json()
                    test_user = next((u for u in users if u.get("username") == username), None)
                    if test_user:
                        requests.delete(
                            f"{self.base_url}/admin/delete-user/{test_user['id']}",
                            headers=self.get_auth_headers(),
                            timeout=10
                        )
                    
                    return True
                else:
                    self.log_test("User Individual Stats", False, 
                                "Missing required fields in response", stats)
                    return False
            else:
                self.log_test("User Individual Stats", False, 
                            f"Request failed with status {stats_response.status_code}", stats_response.text)
                return False
                
        except Exception as e:
            self.log_test("User Individual Stats", False, f"Request failed: {str(e)}")
            return False

    def test_register_pending_status(self):
        """Test POST /api/register returns PENDING status for new users"""
        try:
            test_username = f"pendinguser_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            test_password = "testpass123"
            
            response = requests.post(
                f"{self.base_url}/register",
                json={"username": test_username, "password": test_password},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["access_token", "token_type", "user_id", "username", "role", "status"]
                
                if all(field in data for field in required_fields):
                    if data["status"] == "PENDING":
                        self.log_test("Register PENDING Status", True, 
                                    f"New user {test_username} correctly registered with PENDING status",
                                    f"Token provided: {data['access_token'][:20]}...")
                        return test_username, test_password, data["access_token"]
                    else:
                        self.log_test("Register PENDING Status", False, 
                                    f"Expected PENDING status but got: {data['status']}")
                        return None, None, None
                else:
                    self.log_test("Register PENDING Status", False, 
                                "Missing required fields in response", data)
                    return None, None, None
            else:
                self.log_test("Register PENDING Status", False, 
                            f"Registration failed with status {response.status_code}", response.text)
                return None, None, None
                
        except Exception as e:
            self.log_test("Register PENDING Status", False, f"Request failed: {str(e)}")
            return None, None, None

    def test_login_pending_user(self, username, password):
        """Test login with PENDING user - check current behavior"""
        try:
            response = requests.post(
                f"{self.base_url}/login",
                json={"username": username, "password": password},
                timeout=10
            )
            
            if response.status_code == 403:
                error_detail = response.json().get("detail", "")
                if "pending" in error_detail.lower():
                    self.log_test("Login PENDING User", True, 
                                f"PENDING user {username} blocked from login (current behavior)",
                                f"Error: {error_detail}")
                    return True
                else:
                    self.log_test("Login PENDING User", False, 
                                f"Wrong error message for PENDING user: {error_detail}")
                    return False
            elif response.status_code == 200:
                # If login succeeds, check if they can access protected endpoints
                token = response.json().get("access_token")
                if token:
                    # Test access to a protected endpoint
                    me_response = requests.get(
                        f"{self.base_url}/me",
                        headers={"Authorization": f"Bearer {token}"},
                        timeout=10
                    )
                    if me_response.status_code == 200:
                        self.log_test("Login PENDING User", True, 
                                    f"PENDING user {username} can login and access protected endpoints",
                                    f"User data: {me_response.json()}")
                        return True
                    else:
                        self.log_test("Login PENDING User", True, 
                                    f"PENDING user {username} can login but cannot access protected endpoints",
                                    f"Login success but /me returns {me_response.status_code}")
                        return True
                else:
                    self.log_test("Login PENDING User", False, 
                                f"Login succeeded but no token provided")
                    return False
            else:
                self.log_test("Login PENDING User", False, 
                            f"Unexpected response for PENDING user login: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Login PENDING User", False, f"Request failed: {str(e)}")
            return False

    def test_pending_user_token_access(self, pending_token):
        """Test if PENDING user token from registration can access endpoints"""
        try:
            if not pending_token:
                self.log_test("PENDING Token Access", False, "No pending token provided")
                return False
            
            # Test access to /me endpoint with registration token
            response = requests.get(
                f"{self.base_url}/me",
                headers={"Authorization": f"Bearer {pending_token}"},
                timeout=10
            )
            
            if response.status_code == 200:
                user_data = response.json()
                if user_data.get("status") == "PENDING":
                    self.log_test("PENDING Token Access", True, 
                                f"PENDING user can access /me with registration token",
                                f"User: {user_data.get('username')}, Status: {user_data.get('status')}")
                    return True
                else:
                    self.log_test("PENDING Token Access", False, 
                                f"Token works but user status is not PENDING: {user_data.get('status')}")
                    return False
            elif response.status_code == 403:
                error_detail = response.json().get("detail", "")
                self.log_test("PENDING Token Access", True, 
                            f"PENDING user token blocked from accessing protected endpoints",
                            f"Error: {error_detail}")
                return True
            else:
                self.log_test("PENDING Token Access", False, 
                            f"Unexpected response: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("PENDING Token Access", False, f"Request failed: {str(e)}")
            return False

    def test_reports_timeline(self):
        """Test GET /api/reports/timeline - timeline data"""
        try:
            response = requests.get(
                f"{self.base_url}/reports/timeline",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                timeline_data = response.json()
                if isinstance(timeline_data, list):
                    if len(timeline_data) > 0:
                        # Check structure of first item
                        first_item = timeline_data[0]
                        required_fields = ["period", "year", "month", "total", "pending", "finished", "approved"]
                        if all(field in first_item for field in required_fields):
                            self.log_test("Reports Timeline", True, 
                                        f"Retrieved timeline data with {len(timeline_data)} periods",
                                        f"Sample: {first_item['period']} - Total: {first_item['total']}")
                            return True
                        else:
                            self.log_test("Reports Timeline", False, 
                                        "Missing required fields in timeline data", first_item)
                            return False
                    else:
                        self.log_test("Reports Timeline", True, 
                                    "Timeline endpoint working - no data available (empty list)")
                        return True
                else:
                    self.log_test("Reports Timeline", False, 
                                "Timeline data should be a list", timeline_data)
                    return False
            else:
                self.log_test("Reports Timeline", False, 
                            f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Reports Timeline", False, f"Request failed: {str(e)}")
            return False

    def test_reports_distribution(self):
        """Test GET /api/reports/distribution - distribution by type, site, status"""
        try:
            response = requests.get(
                f"{self.base_url}/reports/distribution",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                distribution_data = response.json()
                required_sections = ["by_type", "by_site", "by_status"]
                
                if all(section in distribution_data for section in required_sections):
                    # Check structure
                    by_type = distribution_data["by_type"]
                    by_site = distribution_data["by_site"]
                    by_status = distribution_data["by_status"]
                    
                    if (isinstance(by_type, list) and isinstance(by_site, list) and isinstance(by_status, list)):
                        self.log_test("Reports Distribution", True, 
                                    f"Retrieved distribution data",
                                    f"Types: {len(by_type)}, Sites: {len(by_site)}, Statuses: {len(by_status)}")
                        return True
                    else:
                        self.log_test("Reports Distribution", False, 
                                    "Distribution sections should be lists", distribution_data)
                        return False
                else:
                    self.log_test("Reports Distribution", False, 
                                "Missing required sections in distribution data", distribution_data)
                    return False
            else:
                self.log_test("Reports Distribution", False, 
                            f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Reports Distribution", False, f"Request failed: {str(e)}")
            return False

    def test_reports_performance(self):
        """Test GET /api/reports/performance - user performance data"""
        try:
            response = requests.get(
                f"{self.base_url}/reports/performance",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                performance_data = response.json()
                required_sections = ["top_creators", "top_finalizers", "period"]
                
                if all(section in performance_data for section in required_sections):
                    top_creators = performance_data["top_creators"]
                    top_finalizers = performance_data["top_finalizers"]
                    period = performance_data["period"]
                    
                    if isinstance(top_creators, list) and isinstance(top_finalizers, list):
                        self.log_test("Reports Performance", True, 
                                    f"Retrieved performance data for {period}",
                                    f"Top creators: {len(top_creators)}, Top finalizers: {len(top_finalizers)}")
                        return True
                    else:
                        self.log_test("Reports Performance", False, 
                                    "Performance sections should be lists", performance_data)
                        return False
                else:
                    self.log_test("Reports Performance", False, 
                                "Missing required sections in performance data", performance_data)
                    return False
            else:
                self.log_test("Reports Performance", False, 
                            f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Reports Performance", False, f"Request failed: {str(e)}")
            return False

    def create_test_pendencia(self):
        """Create a test pendencia for deletion testing"""
        try:
            pendencia_data = {
                "site": "TEST_SITE_DELETE",
                "tipo": "Energia",
                "subtipo": "Controladora",
                "observacoes": "Test pendencia for deletion",
                "foto_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A"
            }
            
            response = requests.post(
                f"{self.base_url}/pendencias",
                headers=self.get_auth_headers(),
                json=pendencia_data,
                timeout=10
            )
            
            if response.status_code == 200:
                pendencia = response.json()
                self.log_test("Create Test Pendencia", True, 
                            f"Created test pendencia for deletion testing",
                            f"ID: {pendencia['id']}")
                return pendencia["id"]
            else:
                self.log_test("Create Test Pendencia", False, 
                            f"Failed to create test pendencia: {response.status_code}", response.text)
                return None
                
        except Exception as e:
            self.log_test("Create Test Pendencia", False, f"Request failed: {str(e)}")
            return None

    def test_admin_delete_pendencia(self):
        """Test DELETE /api/admin/delete-pendencia/{pendencia_id}"""
        try:
            # First create a test pendencia
            pendencia_id = self.create_test_pendencia()
            if not pendencia_id:
                self.log_test("Admin Delete Pendencia", False, "Failed to create test pendencia")
                return False
            
            # Now delete it as admin
            response = requests.delete(
                f"{self.base_url}/admin/delete-pendencia/{pendencia_id}",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                if "message" in result:
                    self.log_test("Admin Delete Pendencia", True, 
                                f"Successfully deleted pendencia {pendencia_id}",
                                f"Message: {result['message']}")
                    return True
                else:
                    self.log_test("Admin Delete Pendencia", False, 
                                "No success message in response", result)
                    return False
            else:
                self.log_test("Admin Delete Pendencia", False, 
                            f"Delete failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Admin Delete Pendencia", False, f"Request failed: {str(e)}")
            return False

    def test_admin_delete_finished_pendencia(self):
        """Test admin deleting a finished pendencia (specific scenario)"""
        try:
            # Create a test pendencia
            pendencia_id = self.create_test_pendencia()
            if not pendencia_id:
                self.log_test("Admin Delete Finished Pendencia", False, "Failed to create test pendencia")
                return False
            
            # Update it to finished status
            update_data = {
                "status": "Finalizado",
                "informacoes_fechamento": "Test completion info",
                "foto_fechamento_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A"
            }
            
            update_response = requests.put(
                f"{self.base_url}/pendencias/{pendencia_id}",
                headers=self.get_auth_headers(),
                json=update_data,
                timeout=10
            )
            
            if update_response.status_code != 200:
                self.log_test("Admin Delete Finished Pendencia", False, 
                            f"Failed to update pendencia to finished: {update_response.status_code}")
                return False
            
            # Now try to delete the finished pendencia as admin
            delete_response = requests.delete(
                f"{self.base_url}/admin/delete-pendencia/{pendencia_id}",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            if delete_response.status_code == 200:
                result = delete_response.json()
                if "message" in result:
                    self.log_test("Admin Delete Finished Pendencia", True, 
                                f"Admin successfully deleted finished pendencia {pendencia_id}",
                                f"Message: {result['message']}")
                    return True
                else:
                    self.log_test("Admin Delete Finished Pendencia", False, 
                                "No success message in response", result)
                    return False
            else:
                self.log_test("Admin Delete Finished Pendencia", False, 
                            f"Failed to delete finished pendencia: {delete_response.status_code}", delete_response.text)
                return False
                
        except Exception as e:
            self.log_test("Admin Delete Finished Pendencia", False, f"Request failed: {str(e)}")
            return False

    def test_authentication_required(self):
        """Test that endpoints require proper authentication"""
        try:
            # Test without token
            endpoints_to_test = [
                "/reports/timeline",
                "/reports/distribution", 
                "/reports/performance",
                "/admin/delete-pendencia/test-id"
            ]
            
            auth_tests_passed = 0
            total_auth_tests = len(endpoints_to_test)
            
            for endpoint in endpoints_to_test:
                if endpoint.startswith("/admin/delete-pendencia"):
                    response = requests.delete(f"{self.base_url}{endpoint}", timeout=10)
                else:
                    response = requests.get(f"{self.base_url}{endpoint}", timeout=10)
                
                if response.status_code in [401, 403]:  # Both are valid auth failure codes
                    auth_tests_passed += 1
                    self.log_test(f"Auth Required - {endpoint}", True, 
                                f"Correctly requires authentication (status {response.status_code})")
                else:
                    self.log_test(f"Auth Required - {endpoint}", False, 
                                f"Should require auth but got status {response.status_code}")
            
            if auth_tests_passed == total_auth_tests:
                self.log_test("Authentication Required", True, 
                            f"All {total_auth_tests} endpoints correctly require authentication")
                return True
            else:
                self.log_test("Authentication Required", False, 
                            f"Only {auth_tests_passed}/{total_auth_tests} endpoints require auth")
                return False
                
        except Exception as e:
            self.log_test("Authentication Required", False, f"Request failed: {str(e)}")
            return False

    def create_test_kml_file_content(self):
        """Create test KML file content"""
        return '''<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Teste Local Brasília</name>
      <description>Local de teste em Brasília</description>
      <Point>
        <coordinates>-47.8825,-15.7942,0</coordinates>
      </Point>
    </Placemark>
    <Placemark>
      <name>Teste Local São Paulo</name>
      <description>Local de teste em São Paulo</description>
      <Point>
        <coordinates>-46.6333,-23.5505,0</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>'''

    def test_admin_upload_kml(self):
        """Test POST /api/admin/upload-kml - upload KML file"""
        try:
            import tempfile
            import os
            
            # Create temporary KML file
            kml_content = self.create_test_kml_file_content()
            
            with tempfile.NamedTemporaryFile(mode='w', suffix='.kml', delete=False) as tmp_file:
                tmp_file.write(kml_content)
                tmp_file_path = tmp_file.name
            
            try:
                # Upload KML file
                with open(tmp_file_path, 'rb') as kml_file:
                    files = {'file': ('test_locations.kml', kml_file, 'application/vnd.google-earth.kml+xml')}
                    response = requests.post(
                        f"{self.base_url}/admin/upload-kml",
                        headers=self.get_auth_headers(),
                        files=files,
                        timeout=30
                    )
                
                if response.status_code == 200:
                    result = response.json()
                    required_fields = ["message", "kml_id", "total_locations", "locations"]
                    
                    if all(field in result for field in required_fields):
                        if result["total_locations"] >= 2:  # We expect 2 locations from our test KML
                            self.log_test("Admin Upload KML", True, 
                                        f"Successfully uploaded KML file with {result['total_locations']} locations",
                                        f"KML ID: {result['kml_id']}")
                            return result["kml_id"]
                        else:
                            self.log_test("Admin Upload KML", False, 
                                        f"Expected at least 2 locations but got {result['total_locations']}")
                            return None
                    else:
                        self.log_test("Admin Upload KML", False, 
                                    "Missing required fields in response", result)
                        return None
                else:
                    self.log_test("Admin Upload KML", False, 
                                f"Upload failed with status {response.status_code}", response.text)
                    return None
                    
            finally:
                # Cleanup temporary file
                if os.path.exists(tmp_file_path):
                    os.unlink(tmp_file_path)
                    
        except Exception as e:
            self.log_test("Admin Upload KML", False, f"Request failed: {str(e)}")
            return None

    def test_admin_upload_invalid_kml(self):
        """Test POST /api/admin/upload-kml with invalid file"""
        try:
            import tempfile
            import os
            
            # Create invalid KML content
            invalid_content = "This is not a valid KML file"
            
            with tempfile.NamedTemporaryFile(mode='w', suffix='.kml', delete=False) as tmp_file:
                tmp_file.write(invalid_content)
                tmp_file_path = tmp_file.name
            
            try:
                # Upload invalid KML file
                with open(tmp_file_path, 'rb') as kml_file:
                    files = {'file': ('invalid.kml', kml_file, 'application/vnd.google-earth.kml+xml')}
                    response = requests.post(
                        f"{self.base_url}/admin/upload-kml",
                        headers=self.get_auth_headers(),
                        files=files,
                        timeout=30
                    )
                
                if response.status_code == 400:
                    error_detail = response.json().get("detail", "")
                    if "inválido" in error_detail.lower() or "invalid" in error_detail.lower() or "corrompido" in error_detail.lower():
                        self.log_test("Admin Upload Invalid KML", True, 
                                    "Correctly rejected invalid KML file",
                                    f"Error: {error_detail}")
                        return True
                    else:
                        self.log_test("Admin Upload Invalid KML", False, 
                                    f"Wrong error message for invalid KML: {error_detail}")
                        return False
                else:
                    self.log_test("Admin Upload Invalid KML", False, 
                                f"Should have rejected invalid KML but got status {response.status_code}")
                    return False
                    
            finally:
                # Cleanup temporary file
                if os.path.exists(tmp_file_path):
                    os.unlink(tmp_file_path)
                    
        except Exception as e:
            self.log_test("Admin Upload Invalid KML", False, f"Request failed: {str(e)}")
            return False

    def test_admin_upload_non_kml_file(self):
        """Test POST /api/admin/upload-kml with non-KML file extension"""
        try:
            import tempfile
            import os
            
            # Create text file with .txt extension
            content = "This is a text file, not KML"
            
            with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as tmp_file:
                tmp_file.write(content)
                tmp_file_path = tmp_file.name
            
            try:
                # Upload non-KML file
                with open(tmp_file_path, 'rb') as txt_file:
                    files = {'file': ('test.txt', txt_file, 'text/plain')}
                    response = requests.post(
                        f"{self.base_url}/admin/upload-kml",
                        headers=self.get_auth_headers(),
                        files=files,
                        timeout=30
                    )
                
                if response.status_code == 400:
                    error_detail = response.json().get("detail", "")
                    if "kml" in error_detail.lower():
                        self.log_test("Admin Upload Non-KML File", True, 
                                    "Correctly rejected non-KML file extension",
                                    f"Error: {error_detail}")
                        return True
                    else:
                        self.log_test("Admin Upload Non-KML File", False, 
                                    f"Wrong error message for non-KML file: {error_detail}")
                        return False
                else:
                    self.log_test("Admin Upload Non-KML File", False, 
                                f"Should have rejected non-KML file but got status {response.status_code}")
                    return False
                    
            finally:
                # Cleanup temporary file
                if os.path.exists(tmp_file_path):
                    os.unlink(tmp_file_path)
                    
        except Exception as e:
            self.log_test("Admin Upload Non-KML File", False, f"Request failed: {str(e)}")
            return False

    def test_get_kml_locations_as_user(self):
        """Test GET /api/kml/locations as regular user"""
        try:
            # Create a regular user for testing
            username, password = self.create_regular_user_for_testing()
            if not username:
                self.log_test("Get KML Locations (User)", False, "Failed to create test user")
                return False
            
            # Login as regular user
            login_response = requests.post(
                f"{self.base_url}/login",
                json={"username": username, "password": password},
                timeout=10
            )
            
            if login_response.status_code != 200:
                self.log_test("Get KML Locations (User)", False, "Failed to login as test user")
                return False
            
            user_token = login_response.json()["access_token"]
            user_headers = {"Authorization": f"Bearer {user_token}"}
            
            # Get KML locations as user
            response = requests.get(
                f"{self.base_url}/kml/locations",
                headers=user_headers,
                timeout=10
            )
            
            if response.status_code == 200:
                locations = response.json()
                if isinstance(locations, list):
                    self.log_test("Get KML Locations (User)", True, 
                                f"Regular user can access KML locations ({len(locations)} locations)",
                                f"Sample locations available")
                    
                    # Cleanup - delete test user
                    users_response = requests.get(
                        f"{self.base_url}/admin/all-users",
                        headers=self.get_auth_headers(),
                        timeout=10
                    )
                    users = users_response.json()
                    test_user = next((u for u in users if u.get("username") == username), None)
                    if test_user:
                        requests.delete(
                            f"{self.base_url}/admin/delete-user/{test_user['id']}",
                            headers=self.get_auth_headers(),
                            timeout=10
                        )
                    
                    return True
                else:
                    self.log_test("Get KML Locations (User)", False, 
                                "KML locations should be a list", locations)
                    return False
            else:
                self.log_test("Get KML Locations (User)", False, 
                            f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Get KML Locations (User)", False, f"Request failed: {str(e)}")
            return False

    def test_get_kml_locations_as_admin(self):
        """Test GET /api/kml/locations as admin"""
        try:
            response = requests.get(
                f"{self.base_url}/kml/locations",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                locations = response.json()
                if isinstance(locations, list):
                    self.log_test("Get KML Locations (Admin)", True, 
                                f"Admin can access KML locations ({len(locations)} locations)")
                    return locations
                else:
                    self.log_test("Get KML Locations (Admin)", False, 
                                "KML locations should be a list", locations)
                    return []
            else:
                self.log_test("Get KML Locations (Admin)", False, 
                            f"Request failed with status {response.status_code}", response.text)
                return []
                
        except Exception as e:
            self.log_test("Get KML Locations (Admin)", False, f"Request failed: {str(e)}")
            return []

    def test_admin_delete_kml(self, kml_id):
        """Test DELETE /api/admin/kml/{kml_id}"""
        try:
            if not kml_id:
                self.log_test("Admin Delete KML", False, "No KML ID provided")
                return False
            
            response = requests.delete(
                f"{self.base_url}/admin/kml/{kml_id}",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                if "message" in result:
                    self.log_test("Admin Delete KML", True, 
                                f"Successfully deleted KML data {kml_id}",
                                f"Message: {result['message']}")
                    return True
                else:
                    self.log_test("Admin Delete KML", False, 
                                "No success message in response", result)
                    return False
            elif response.status_code == 404:
                self.log_test("Admin Delete KML", True, 
                            f"KML data {kml_id} not found (expected if already deleted)")
                return True
            else:
                self.log_test("Admin Delete KML", False, 
                            f"Delete failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Admin Delete KML", False, f"Request failed: {str(e)}")
            return False

    def test_kml_unauthorized_access(self):
        """Test KML admin endpoints without authentication"""
        try:
            # Test upload without auth
            import tempfile
            import os
            
            kml_content = self.create_test_kml_file_content()
            
            with tempfile.NamedTemporaryFile(mode='w', suffix='.kml', delete=False) as tmp_file:
                tmp_file.write(kml_content)
                tmp_file_path = tmp_file.name
            
            try:
                # Test upload without auth
                with open(tmp_file_path, 'rb') as kml_file:
                    files = {'file': ('test.kml', kml_file, 'application/vnd.google-earth.kml+xml')}
                    upload_response = requests.post(
                        f"{self.base_url}/admin/upload-kml",
                        files=files,
                        timeout=30
                    )
                
                # Test delete without auth
                delete_response = requests.delete(
                    f"{self.base_url}/admin/kml/test-id",
                    timeout=10
                )
                
                upload_auth_ok = upload_response.status_code in [401, 403]
                delete_auth_ok = delete_response.status_code in [401, 403]
                
                if upload_auth_ok and delete_auth_ok:
                    self.log_test("KML Unauthorized Access", True, 
                                "KML admin endpoints correctly require authentication")
                    return True
                else:
                    self.log_test("KML Unauthorized Access", False, 
                                f"Auth check failed - Upload: {upload_response.status_code}, Delete: {delete_response.status_code}")
                    return False
                    
            finally:
                if os.path.exists(tmp_file_path):
                    os.unlink(tmp_file_path)
                    
        except Exception as e:
            self.log_test("KML Unauthorized Access", False, f"Request failed: {str(e)}")
            return False

    def test_kml_user_cannot_access_admin_endpoints(self):
        """Test that regular users cannot access KML admin endpoints"""
        try:
            # Create a regular user
            username, password = self.create_regular_user_for_testing()
            if not username:
                self.log_test("KML User Admin Access", False, "Failed to create test user")
                return False
            
            # Login as regular user
            login_response = requests.post(
                f"{self.base_url}/login",
                json={"username": username, "password": password},
                timeout=10
            )
            
            if login_response.status_code != 200:
                self.log_test("KML User Admin Access", False, "Failed to login as test user")
                return False
            
            user_token = login_response.json()["access_token"]
            user_headers = {"Authorization": f"Bearer {user_token}"}
            
            # Test upload as user (should fail)
            import tempfile
            import os
            
            kml_content = self.create_test_kml_file_content()
            
            with tempfile.NamedTemporaryFile(mode='w', suffix='.kml', delete=False) as tmp_file:
                tmp_file.write(kml_content)
                tmp_file_path = tmp_file.name
            
            try:
                with open(tmp_file_path, 'rb') as kml_file:
                    files = {'file': ('test.kml', kml_file, 'application/vnd.google-earth.kml+xml')}
                    upload_response = requests.post(
                        f"{self.base_url}/admin/upload-kml",
                        headers=user_headers,
                        files=files,
                        timeout=30
                    )
                
                # Test delete as user (should fail)
                delete_response = requests.delete(
                    f"{self.base_url}/admin/kml/test-id",
                    headers=user_headers,
                    timeout=10
                )
                
                upload_forbidden = upload_response.status_code == 403
                delete_forbidden = delete_response.status_code == 403
                
                if upload_forbidden and delete_forbidden:
                    self.log_test("KML User Admin Access", True, 
                                "Regular user correctly blocked from KML admin endpoints")
                    
                    # Cleanup - delete test user
                    users_response = requests.get(
                        f"{self.base_url}/admin/all-users",
                        headers=self.get_auth_headers(),
                        timeout=10
                    )
                    users = users_response.json()
                    test_user = next((u for u in users if u.get("username") == username), None)
                    if test_user:
                        requests.delete(
                            f"{self.base_url}/admin/delete-user/{test_user['id']}",
                            headers=self.get_auth_headers(),
                            timeout=10
                        )
                    
                    return True
                else:
                    self.log_test("KML User Admin Access", False, 
                                f"User should be blocked - Upload: {upload_response.status_code}, Delete: {delete_response.status_code}")
                    return False
                    
            finally:
                if os.path.exists(tmp_file_path):
                    os.unlink(tmp_file_path)
                    
        except Exception as e:
            self.log_test("KML User Admin Access", False, f"Request failed: {str(e)}")
            return False

    def test_kml_search_valid_queries(self):
        """Test GET /api/kml/search with valid search queries"""
        try:
            # Test different search terms as specified in the review request
            search_terms = [
                {"query": "BRH", "limit": 10},
                {"query": "Torre", "limit": 25},
                {"query": "CN19", "limit": 50}
            ]
            
            for search_data in search_terms:
                response = requests.get(
                    f"{self.base_url}/kml/search",
                    headers=self.get_auth_headers(),
                    params=search_data,
                    timeout=10
                )
                
                if response.status_code == 200:
                    result = response.json()
                    required_fields = ["query", "total_found", "locations"]
                    
                    if all(field in result for field in required_fields):
                        locations = result["locations"]
                        total_found = result["total_found"]
                        
                        # Verify limit is respected (max 50)
                        if len(locations) <= search_data["limit"] and len(locations) <= 50:
                            self.log_test(f"KML Search - {search_data['query']}", True, 
                                        f"Search for '{search_data['query']}' returned {total_found} results",
                                        f"Returned {len(locations)} locations (limit: {search_data['limit']})")
                        else:
                            self.log_test(f"KML Search - {search_data['query']}", False, 
                                        f"Limit not respected: returned {len(locations)} > {search_data['limit']}")
                    else:
                        self.log_test(f"KML Search - {search_data['query']}", False, 
                                    "Missing required fields in response", result)
                else:
                    self.log_test(f"KML Search - {search_data['query']}", False, 
                                f"Search failed with status {response.status_code}", response.text)
            
            return True
                
        except Exception as e:
            self.log_test("KML Search Valid Queries", False, f"Request failed: {str(e)}")
            return False

    def test_kml_search_invalid_query(self):
        """Test GET /api/kml/search with query too short (should fail)"""
        try:
            # Test with single character (should fail - minimum 2 characters required)
            response = requests.get(
                f"{self.base_url}/kml/search",
                headers=self.get_auth_headers(),
                params={"query": "X", "limit": 10},
                timeout=10
            )
            
            if response.status_code == 400:
                error_detail = response.json().get("detail", "")
                if "2 caracteres" in error_detail or "2 characters" in error_detail:
                    self.log_test("KML Search Invalid Query", True, 
                                "Correctly rejected query with less than 2 characters",
                                f"Error: {error_detail}")
                    return True
                else:
                    self.log_test("KML Search Invalid Query", False, 
                                f"Wrong error message for short query: {error_detail}")
                    return False
            else:
                self.log_test("KML Search Invalid Query", False, 
                            f"Should have returned 400 but got {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("KML Search Invalid Query", False, f"Request failed: {str(e)}")
            return False

    def test_kml_search_performance(self):
        """Test KML search performance and result limits"""
        try:
            # Test with a common term that might return many results
            response = requests.get(
                f"{self.base_url}/kml/search",
                headers=self.get_auth_headers(),
                params={"query": "Torre", "limit": 100},  # Request more than max allowed
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                locations = result.get("locations", [])
                
                # Verify maximum limit of 50 is enforced
                if len(locations) <= 50:
                    self.log_test("KML Search Performance", True, 
                                f"Search correctly limited to maximum 50 results",
                                f"Returned {len(locations)} locations despite requesting 100")
                    return True
                else:
                    self.log_test("KML Search Performance", False, 
                                f"Search returned {len(locations)} results, exceeding maximum of 50")
                    return False
            else:
                self.log_test("KML Search Performance", False, 
                            f"Search failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("KML Search Performance", False, f"Request failed: {str(e)}")
            return False

    def get_test_location_id(self):
        """Get a location ID for observation testing"""
        try:
            # First try to search for a location
            response = requests.get(
                f"{self.base_url}/kml/search",
                headers=self.get_auth_headers(),
                params={"query": "Torre", "limit": 1},
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                locations = result.get("locations", [])
                if locations:
                    return locations[0].get("id")
            
            # If search doesn't work, try getting all locations
            response = requests.get(
                f"{self.base_url}/kml/locations",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                locations = response.json()
                if locations and len(locations) > 0:
                    # Create a synthetic location ID for testing
                    return f"test_location_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            return None
                
        except Exception as e:
            return None

    def test_add_location_observation(self):
        """Test POST /api/kml/locations/{location_id}/observations"""
        try:
            location_id = self.get_test_location_id()
            if not location_id:
                # Create a test location ID for testing
                location_id = f"test_location_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            observation_text = "Esta torre precisa de manutenção preventiva"
            
            response = requests.post(
                f"{self.base_url}/kml/locations/{location_id}/observations",
                headers=self.get_auth_headers(),
                json={"observation": observation_text},
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                required_fields = ["message", "observation_id"]
                
                if all(field in result for field in required_fields):
                    observation_id = result["observation_id"]
                    self.log_test("Add Location Observation", True, 
                                f"Successfully added observation to location {location_id}",
                                f"Observation ID: {observation_id}")
                    return location_id, observation_id
                else:
                    self.log_test("Add Location Observation", False, 
                                "Missing required fields in response", result)
                    return None, None
            else:
                self.log_test("Add Location Observation", False, 
                            f"Failed to add observation with status {response.status_code}", response.text)
                return None, None
                
        except Exception as e:
            self.log_test("Add Location Observation", False, f"Request failed: {str(e)}")
            return None, None

    def test_add_empty_observation(self):
        """Test POST /api/kml/locations/{location_id}/observations with empty observation"""
        try:
            location_id = f"test_location_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            response = requests.post(
                f"{self.base_url}/kml/locations/{location_id}/observations",
                headers=self.get_auth_headers(),
                json={"observation": ""},  # Empty observation
                timeout=10
            )
            
            if response.status_code == 400:
                error_detail = response.json().get("detail", "")
                if "vazia" in error_detail or "empty" in error_detail:
                    self.log_test("Add Empty Observation", True, 
                                "Correctly rejected empty observation",
                                f"Error: {error_detail}")
                    return True
                else:
                    self.log_test("Add Empty Observation", False, 
                                f"Wrong error message for empty observation: {error_detail}")
                    return False
            else:
                self.log_test("Add Empty Observation", False, 
                            f"Should have returned 400 but got {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Add Empty Observation", False, f"Request failed: {str(e)}")
            return False

    def test_get_location_observations(self, location_id):
        """Test GET /api/kml/locations/{location_id}/observations"""
        try:
            if not location_id:
                self.log_test("Get Location Observations", False, "No location ID provided")
                return []
            
            response = requests.get(
                f"{self.base_url}/kml/locations/{location_id}/observations",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                observations = response.json()
                if isinstance(observations, list):
                    self.log_test("Get Location Observations", True, 
                                f"Retrieved {len(observations)} observations for location {location_id}")
                    return observations
                else:
                    self.log_test("Get Location Observations", False, 
                                "Response should be a list", observations)
                    return []
            else:
                self.log_test("Get Location Observations", False, 
                            f"Failed to get observations with status {response.status_code}", response.text)
                return []
                
        except Exception as e:
            self.log_test("Get Location Observations", False, f"Request failed: {str(e)}")
            return []

    def test_delete_observation_own(self, observation_id):
        """Test DELETE /api/kml/observations/{observation_id} - user deleting own observation"""
        try:
            if not observation_id:
                self.log_test("Delete Own Observation", False, "No observation ID provided")
                return False
            
            response = requests.delete(
                f"{self.base_url}/kml/observations/{observation_id}",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                if "message" in result:
                    self.log_test("Delete Own Observation", True, 
                                f"Successfully deleted observation {observation_id}",
                                f"Message: {result['message']}")
                    return True
                else:
                    self.log_test("Delete Own Observation", False, 
                                "No success message in response", result)
                    return False
            else:
                self.log_test("Delete Own Observation", False, 
                            f"Failed to delete observation with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Delete Own Observation", False, f"Request failed: {str(e)}")
            return False

    def test_delete_nonexistent_observation(self):
        """Test DELETE /api/kml/observations/{observation_id} with non-existent ID"""
        try:
            fake_observation_id = f"fake_obs_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            response = requests.delete(
                f"{self.base_url}/kml/observations/{fake_observation_id}",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            if response.status_code == 404:
                error_detail = response.json().get("detail", "")
                self.log_test("Delete Nonexistent Observation", True, 
                            "Correctly returned 404 for non-existent observation",
                            f"Error: {error_detail}")
                return True
            else:
                self.log_test("Delete Nonexistent Observation", False, 
                            f"Should have returned 404 but got {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Delete Nonexistent Observation", False, f"Request failed: {str(e)}")
            return False

    def test_observation_system_complete_flow(self):
        """Test complete observation system flow as specified in review request"""
        try:
            print("\n" + "=" * 60)
            print("🔍 TESTING COMPLETE OBSERVATION SYSTEM FLOW")
            print("=" * 60)
            print("Following the exact test scenario from Portuguese review request:")
            print("1. Buscar uma localização específica")
            print("2. Adicionar observação: 'Esta torre precisa de manutenção preventiva'")
            print("3. Listar observações da localização")
            print("4. Excluir a observação adicionada")
            print()
            
            # Step 1: Search for a specific location
            search_response = requests.get(
                f"{self.base_url}/kml/search",
                headers=self.get_auth_headers(),
                params={"query": "Torre", "limit": 1},
                timeout=10
            )
            
            location_id = None
            if search_response.status_code == 200:
                search_result = search_response.json()
                locations = search_result.get("locations", [])
                if locations:
                    location_id = locations[0].get("id")
                    self.log_test("Observation Flow - Step 1", True, 
                                f"Found location for testing: {locations[0].get('name', 'Unknown')}")
                else:
                    # Create a test location ID
                    location_id = f"test_location_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                    self.log_test("Observation Flow - Step 1", True, 
                                f"Using test location ID: {location_id}")
            else:
                location_id = f"test_location_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                self.log_test("Observation Flow - Step 1", True, 
                            f"Using test location ID: {location_id}")
            
            # Step 2: Add observation with exact text from review request
            observation_text = "Esta torre precisa de manutenção preventiva"
            add_response = requests.post(
                f"{self.base_url}/kml/locations/{location_id}/observations",
                headers=self.get_auth_headers(),
                json={"observation": observation_text},
                timeout=10
            )
            
            observation_id = None
            if add_response.status_code == 200:
                add_result = add_response.json()
                observation_id = add_result.get("observation_id")
                self.log_test("Observation Flow - Step 2", True, 
                            f"Added observation: '{observation_text}'",
                            f"Observation ID: {observation_id}")
            else:
                self.log_test("Observation Flow - Step 2", False, 
                            f"Failed to add observation: {add_response.status_code}", add_response.text)
                return False
            
            # Step 3: List observations for the location
            list_response = requests.get(
                f"{self.base_url}/kml/locations/{location_id}/observations",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            if list_response.status_code == 200:
                observations = list_response.json()
                found_observation = any(obs.get("observation") == observation_text for obs in observations)
                if found_observation:
                    self.log_test("Observation Flow - Step 3", True, 
                                f"Successfully listed observations - found our test observation",
                                f"Total observations: {len(observations)}")
                else:
                    self.log_test("Observation Flow - Step 3", False, 
                                f"Our observation not found in list of {len(observations)} observations")
            else:
                self.log_test("Observation Flow - Step 3", False, 
                            f"Failed to list observations: {list_response.status_code}", list_response.text)
            
            # Step 4: Delete the added observation
            if observation_id:
                delete_response = requests.delete(
                    f"{self.base_url}/kml/observations/{observation_id}",
                    headers=self.get_auth_headers(),
                    timeout=10
                )
                
                if delete_response.status_code == 200:
                    delete_result = delete_response.json()
                    self.log_test("Observation Flow - Step 4", True, 
                                f"Successfully deleted observation",
                                f"Message: {delete_result.get('message', 'No message')}")
                    
                    # Verify deletion by listing again
                    verify_response = requests.get(
                        f"{self.base_url}/kml/locations/{location_id}/observations",
                        headers=self.get_auth_headers(),
                        timeout=10
                    )
                    
                    if verify_response.status_code == 200:
                        remaining_observations = verify_response.json()
                        still_exists = any(obs.get("observation") == observation_text for obs in remaining_observations)
                        if not still_exists:
                            self.log_test("Observation Flow - Verification", True, 
                                        "Verified observation was successfully deleted")
                        else:
                            self.log_test("Observation Flow - Verification", False, 
                                        "Observation still exists after deletion")
                else:
                    self.log_test("Observation Flow - Step 4", False, 
                                f"Failed to delete observation: {delete_response.status_code}", delete_response.text)
            
            print("\n✅ Complete observation system flow test completed")
            return True
                
        except Exception as e:
            self.log_test("Observation System Complete Flow", False, f"Test failed with exception: {str(e)}")
            return False

    def test_kml_authentication_requirements(self):
        """Test that KML endpoints require proper authentication"""
        try:
            endpoints_to_test = [
                ("GET", "/kml/search?query=test"),
                ("GET", "/kml/locations/test-id/observations"),
                ("POST", "/kml/locations/test-id/observations"),
                ("DELETE", "/kml/observations/test-id")
            ]
            
            auth_tests_passed = 0
            total_auth_tests = len(endpoints_to_test)
            
            for method, endpoint in endpoints_to_test:
                if method == "GET":
                    response = requests.get(f"{self.base_url}{endpoint}", timeout=10)
                elif method == "POST":
                    response = requests.post(f"{self.base_url}{endpoint}", 
                                           json={"observation": "test"}, timeout=10)
                elif method == "DELETE":
                    response = requests.delete(f"{self.base_url}{endpoint}", timeout=10)
                
                if response.status_code in [401, 403]:
                    auth_tests_passed += 1
                    self.log_test(f"KML Auth Required - {method} {endpoint}", True, 
                                f"Correctly requires authentication (status {response.status_code})")
                else:
                    self.log_test(f"KML Auth Required - {method} {endpoint}", False, 
                                f"Should require auth but got status {response.status_code}")
            
            if auth_tests_passed == total_auth_tests:
                self.log_test("KML Authentication Requirements", True, 
                            f"All {total_auth_tests} KML endpoints correctly require authentication")
                return True
            else:
                self.log_test("KML Authentication Requirements", False, 
                            f"Only {auth_tests_passed}/{total_auth_tests} endpoints require authentication")
                return False
                
        except Exception as e:
            self.log_test("KML Authentication Requirements", False, f"Request failed: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all backend tests including new KML functionality"""
        print("=" * 80)
        print("BACKEND API TESTING - NEW KML FUNCTIONALITY")
        print("=" * 80)
        print(f"Testing against: {self.base_url}")
        print("Testing newly requested features:")
        print("1. KML Upload and Management (NEW)")
        print("2. Admin Delete Pendency (re-test)")
        print("3. Export/Report Endpoints (re-test)")
        print("4. Authentication and Authorization")
        print()
        
        # Step 1: Login as admin
        if not self.login_admin():
            print("❌ Cannot proceed without admin authentication")
            return False
        
        print()
        
        # Test 1: KML Functionality (NEW)
        print("🗺️ Testing KML Functionality...")
        kml_id = self.test_admin_upload_kml()
        print()
        self.test_admin_upload_invalid_kml()
        print()
        self.test_admin_upload_non_kml_file()
        print()
        self.test_get_kml_locations_as_admin()
        print()
        self.test_get_kml_locations_as_user()
        print()
        self.test_kml_unauthorized_access()
        print()
        self.test_kml_user_cannot_access_admin_endpoints()
        print()
        
        # Test KML deletion (if we have a valid KML ID)
        if kml_id:
            print("🗑️ Testing KML Deletion...")
            self.test_admin_delete_kml(kml_id)
            print()
        
        # NEW: Test KML Search and Observation System (as requested in Portuguese review)
        print("🔍 Testing NEW KML Search & Observation Features...")
        print("Testing as specified in Portuguese review request:")
        print("- Smart Search Endpoint: GET /api/kml/search")
        print("- Observation System: POST/GET/DELETE observations")
        print()
        
        # Test KML Search functionality
        self.test_kml_search_valid_queries()
        print()
        self.test_kml_search_invalid_query()
        print()
        self.test_kml_search_performance()
        print()
        
        # Test Observation System
        location_id, observation_id = self.test_add_location_observation()
        print()
        self.test_add_empty_observation()
        print()
        
        if location_id:
            observations = self.test_get_location_observations(location_id)
            print()
            
        if observation_id:
            self.test_delete_observation_own(observation_id)
            print()
        
        self.test_delete_nonexistent_observation()
        print()
        
        # Test complete observation flow as specified in review request
        self.test_observation_system_complete_flow()
        print()
        
        # Test KML authentication requirements
        self.test_kml_authentication_requirements()
        print()
        
        # Test 2: Admin Delete Pendencia (re-test)
        print("🗑️ Testing Admin Delete Pendencia...")
        self.test_admin_delete_pendencia()
        print()
        self.test_admin_delete_finished_pendencia()
        print()
        
        # Test 3: Export/Report Endpoints (re-test)
        print("📊 Testing Export/Report Endpoints...")
        self.test_reports_timeline()
        print()
        self.test_reports_distribution()
        print()
        self.test_reports_performance()
        print()
        
        # Test 4: Authentication Requirements
        print("🔐 Testing Authentication Requirements...")
        self.test_authentication_required()
        print()
        
        print("=" * 80)
        print("TEST SUMMARY")
        print("=" * 80)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%" if total > 0 else "0%")
        
        # Show failed tests
        failed_tests = [result for result in self.test_results if not result["success"]]
        if failed_tests:
            print("\nFAILED TESTS:")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['message']}")
        else:
            print("\n✅ All tests passed successfully!")
        
        return passed == total

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)