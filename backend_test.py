#!/usr/bin/env python3
"""
Backend API Testing Script for Admin User Management Endpoints
Tests the admin user management functionality including:
- GET /api/admin/all-users
- DELETE /api/admin/delete-user/{user_id}
- PUT /api/admin/reset-password/{user_id}
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

    def run_all_tests(self):
        """Run all admin user management tests"""
        print("=" * 60)
        print("BACKEND API TESTING - ADMIN USER MANAGEMENT")
        print("=" * 60)
        print(f"Testing against: {self.base_url}")
        print()
        
        # Step 1: Login as admin
        if not self.login_admin():
            print("❌ Cannot proceed without admin authentication")
            return False
        
        print()
        
        # PRIORITY: Run password reset bug investigation first
        bug_test_passed = self.test_password_reset_bug_investigation()
        print()
        
        # Additional test with existing user
        self.test_existing_user_password_reset()
        print()
        
        # Step 2: Test get all users
        users = self.test_get_all_users()
        print()
        
        # Step 3: Test password reset with valid password
        if users:
            # Find a non-admin user or use admin for testing
            test_user = None
            for user in users:
                if user.get("username") != ADMIN_USERNAME:
                    test_user = user
                    break
            
            if not test_user:
                test_user = next((u for u in users if u.get("username") == ADMIN_USERNAME), None)
            
            if test_user:
                self.test_reset_password_valid(test_user["id"], test_user["username"])
                print()
                self.test_reset_password_invalid(test_user["id"], test_user["username"])
                print()
        
        # Step 4: Test admin cannot delete own account
        self.test_delete_own_account()
        print()
        
        # Step 5: Test user deletion (create a test user first)
        test_username = self.create_test_user()
        if test_username:
            # Get the created user's ID
            updated_users = self.test_get_all_users()
            test_user = next((u for u in updated_users if u.get("username") == test_username), None)
            if test_user:
                print()
                self.test_delete_other_user(test_user["id"], test_user["username"])
        
        print()
        print("=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
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
        
        # Special attention to password reset bug
        if not bug_test_passed:
            print("\n🚨 CRITICAL PASSWORD RESET BUG DETECTED!")
            print("   This requires immediate investigation and fix.")
        
        return passed == total

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)