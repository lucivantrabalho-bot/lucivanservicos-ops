#!/usr/bin/env python3
"""
Deep Password Reset Investigation
This script directly checks the database to verify password hash changes
"""

import requests
import json
import sys
from datetime import datetime
import hashlib
import os
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

# Configuration
BASE_URL = "https://pendency-hub.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"
SECRET_KEY = "your-secret-key-here-change-in-production-very-long-secret-key"

class DeepPasswordTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.admin_token = None
        self.mongo_client = None
        self.db = None
        
    def get_password_hash(self, password):
        """Replicate the backend password hashing logic"""
        return hashlib.sha256((password + SECRET_KEY).encode()).hexdigest()
    
    async def connect_to_db(self):
        """Connect to MongoDB"""
        try:
            mongo_url = "mongodb://localhost:27017"
            self.mongo_client = AsyncIOMotorClient(mongo_url)
            self.db = self.mongo_client["test_database"]
            print("✅ Connected to MongoDB")
            return True
        except Exception as e:
            print(f"❌ Failed to connect to MongoDB: {e}")
            return False
    
    def login_admin(self):
        """Login as admin"""
        try:
            response = requests.post(
                f"{self.base_url}/login",
                json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data["access_token"]
                print("✅ Admin login successful")
                return True
            else:
                print(f"❌ Admin login failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Admin login error: {e}")
            return False
    
    def get_auth_headers(self):
        return {"Authorization": f"Bearer {self.admin_token}"}
    
    async def get_user_from_db(self, username):
        """Get user directly from database"""
        try:
            user = await self.db.users.find_one({"username": username})
            return user
        except Exception as e:
            print(f"❌ Database query error: {e}")
            return None
    
    async def run_deep_investigation(self):
        """Run comprehensive password reset investigation"""
        print("=" * 80)
        print("🔍 DEEP PASSWORD RESET INVESTIGATION")
        print("=" * 80)
        print("This test will:")
        print("1. Create a test user")
        print("2. Check password hash in database")
        print("3. Reset password via API")
        print("4. Check if hash changed in database")
        print("5. Test login with both old and new passwords")
        print()
        
        # Connect to database
        if not await self.connect_to_db():
            return False
        
        # Login as admin
        if not self.login_admin():
            return False
        
        # Create test user
        test_username = f"deeptest_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        original_password = "original123"
        new_password = "newpass456"
        
        print(f"Creating test user: {test_username}")
        
        try:
            # Create user
            response = requests.post(
                f"{self.base_url}/register",
                json={"username": test_username, "password": original_password},
                timeout=10
            )
            
            if response.status_code != 200:
                print(f"❌ Failed to create user: {response.status_code}")
                return False
            
            print("✅ Test user created")
            
            # Get user from database to check initial hash
            user_data = await self.get_user_from_db(test_username)
            if not user_data:
                print("❌ Could not find user in database")
                return False
            
            user_id = user_data["id"]
            original_hash = user_data["hashed_password"]
            expected_original_hash = self.get_password_hash(original_password)
            
            print(f"User ID: {user_id}")
            print(f"Original hash in DB: {original_hash}")
            print(f"Expected hash: {expected_original_hash}")
            print(f"Hash matches expected: {'✅ YES' if original_hash == expected_original_hash else '❌ NO'}")
            
            # Approve user
            approve_response = requests.put(
                f"{self.base_url}/admin/approve-user/{user_id}",
                headers=self.get_auth_headers(),
                json={"status": "APPROVED"},
                timeout=10
            )
            
            if approve_response.status_code != 200:
                print(f"❌ Failed to approve user: {approve_response.status_code}")
                return False
            
            print("✅ User approved")
            
            # Test original login
            login_response = requests.post(
                f"{self.base_url}/login",
                json={"username": test_username, "password": original_password},
                timeout=10
            )
            
            original_login_works = login_response.status_code == 200
            print(f"Original password login: {'✅ SUCCESS' if original_login_works else '❌ FAILED'}")
            
            if not original_login_works:
                print(f"Login response: {login_response.status_code} - {login_response.text}")
                return False
            
            print("\n" + "="*50)
            print("🔄 RESETTING PASSWORD")
            print("="*50)
            
            # Reset password via API
            reset_response = requests.put(
                f"{self.base_url}/admin/reset-password/{user_id}",
                headers=self.get_auth_headers(),
                json={"new_password": new_password},
                timeout=10
            )
            
            if reset_response.status_code != 200:
                print(f"❌ Password reset failed: {reset_response.status_code}")
                return False
            
            print("✅ Password reset API call successful")
            
            # Check hash in database after reset
            user_data_after = await self.get_user_from_db(test_username)
            if not user_data_after:
                print("❌ Could not find user in database after reset")
                return False
            
            new_hash = user_data_after["hashed_password"]
            expected_new_hash = self.get_password_hash(new_password)
            
            print(f"\nPassword Hash Analysis:")
            print(f"Original hash: {original_hash}")
            print(f"New hash in DB: {new_hash}")
            print(f"Expected new hash: {expected_new_hash}")
            print(f"Hash actually changed: {'✅ YES' if original_hash != new_hash else '🚨 NO (BUG!)'}")
            print(f"New hash is correct: {'✅ YES' if new_hash == expected_new_hash else '❌ NO'}")
            
            if original_hash == new_hash:
                print("\n🚨 CRITICAL BUG DETECTED!")
                print("   The password hash was NOT updated in the database!")
                print("   This explains why old passwords still work.")
                return False
            
            print("\n" + "="*50)
            print("🧪 TESTING LOGIN BEHAVIOR")
            print("="*50)
            
            # Test new password login
            new_login_response = requests.post(
                f"{self.base_url}/login",
                json={"username": test_username, "password": new_password},
                timeout=10
            )
            
            new_password_works = new_login_response.status_code == 200
            print(f"New password login: {'✅ SUCCESS' if new_password_works else '❌ FAILED'}")
            
            if not new_password_works:
                print(f"New login response: {new_login_response.status_code} - {new_login_response.text}")
            
            # Test old password login (should fail)
            old_login_response = requests.post(
                f"{self.base_url}/login",
                json={"username": test_username, "password": original_password},
                timeout=10
            )
            
            old_password_still_works = old_login_response.status_code == 200
            print(f"Old password login: {'🚨 STILL WORKS (BUG!)' if old_password_still_works else '✅ CORRECTLY REJECTED'}")
            
            if old_password_still_works:
                print(f"Old login response: {old_login_response.status_code} - {old_login_response.text}")
                print("\n🚨 PASSWORD RESET BUG CONFIRMED!")
                print("   User can still login with old password after reset")
                bug_detected = True
            else:
                print("\n✅ Password reset working correctly")
                bug_detected = False
            
            # Cleanup
            delete_response = requests.delete(
                f"{self.base_url}/admin/delete-user/{user_id}",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            if delete_response.status_code == 200:
                print("✅ Test user cleaned up")
            
            return not bug_detected
            
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
            return False
        finally:
            if self.mongo_client:
                self.mongo_client.close()

async def main():
    tester = DeepPasswordTester()
    success = await tester.run_deep_investigation()
    return success

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)