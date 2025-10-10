#!/usr/bin/env python3
"""
Test AMI field functionality only
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "https://pendency-hub.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

def login_admin():
    """Login as admin to get authentication token"""
    try:
        response = requests.post(
            f"{BASE_URL}/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            return data["access_token"]
        else:
            print(f"Login failed with status {response.status_code}")
            return None
            
    except Exception as e:
        print(f"Login request failed: {str(e)}")
        return None

def test_ami_field():
    """Test AMI field in pendencia creation"""
    token = login_admin()
    if not token:
        print("❌ Cannot proceed without admin authentication")
        return False
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        # Create pendencia with AMI field
        pendencia_data = {
            "site": "TEST_AMI_SITE",
            "ami": "AMI123456",  # Test AMI field
            "tipo": "Energia",
            "subtipo": "Controladora",
            "observacoes": "Test pendencia with AMI field",
            "foto_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A"
        }
        
        print("Creating pendencia with AMI field...")
        print(f"AMI value being sent: {pendencia_data['ami']}")
        
        response = requests.post(
            f"{BASE_URL}/pendencias",
            headers=headers,
            json=pendencia_data,
            timeout=10
        )
        
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            pendencia = response.json()
            print(f"Created pendencia: {json.dumps(pendencia, indent=2)}")
            
            ami_value = pendencia.get("ami")
            print(f"AMI value in response: {ami_value}")
            
            if ami_value == "AMI123456":
                print("✅ SUCCESS: AMI field correctly saved and returned")
                
                # Cleanup - delete test pendencia
                delete_response = requests.delete(
                    f"{BASE_URL}/admin/delete-pendencia/{pendencia['id']}",
                    headers=headers,
                    timeout=10
                )
                print(f"Cleanup delete status: {delete_response.status_code}")
                
                return True
            else:
                print(f"❌ FAIL: AMI field not correctly saved. Expected 'AMI123456', got '{ami_value}'")
                return False
        else:
            print(f"❌ FAIL: Pendencia creation failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ FAIL: Request failed: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_ami_field()
    print(f"\nTest result: {'PASSED' if success else 'FAILED'}")