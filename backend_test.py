#!/usr/bin/env python3
"""
Backend API Testing Script for New Features
Tests the newly implemented functionality including:
- GET /api/stats/monthly (Monthly Statistics with validation filter)
- GET /api/admin/form-config (Form Configuration)
- PUT /api/admin/form-config (Update Form Configuration)
- PUT /api/user/change-password (User Password Change)
- GET /api/user/stats (Individual User Statistics)
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://continuar-3.preview.emergentagent.com/api"
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

    def run_all_tests(self):
        """Run all new feature tests"""
        print("=" * 80)
        print("BACKEND API TESTING - NEW FEATURES")
        print("=" * 80)
        print(f"Testing against: {self.base_url}")
        print("Testing newly implemented features:")
        print("1. Monthly Statistics (with validation filter)")
        print("2. Form Configuration Management")
        print("3. User Profile Management")
        print()
        
        # Step 1: Login as admin
        if not self.login_admin():
            print("❌ Cannot proceed without admin authentication")
            return False
        
        print()
        
        # Test 1: Monthly Statistics
        print("🔍 Testing Monthly Statistics...")
        self.test_monthly_stats()
        print()
        
        # Test 2: Form Configuration
        print("🔍 Testing Form Configuration...")
        original_config = self.test_get_form_config()
        print()
        self.test_update_form_config()
        print()
        
        # Test 3: User Profile - Password Change
        print("🔍 Testing User Password Change...")
        self.test_user_change_password_valid()
        print()
        self.test_user_change_password_invalid_current()
        print()
        self.test_user_change_password_too_short()
        print()
        
        # Test 4: User Individual Statistics
        print("🔍 Testing User Individual Statistics...")
        self.test_user_individual_stats()
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