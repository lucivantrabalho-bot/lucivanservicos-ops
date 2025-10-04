#!/usr/bin/env python3
"""
KML Parser Robustness Testing - Additional scenarios
Tests various edge cases and robustness scenarios for the KML parser
"""

import requests
import json
import tempfile
import os
from datetime import datetime

# Configuration
BASE_URL = "https://pendency-hub.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

def login_admin():
    """Login as admin"""
    try:
        response = requests.post(
            f"{BASE_URL}/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Successfully logged in as admin")
            return data["access_token"]
        else:
            print(f"❌ Login failed with status {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ Login request failed: {str(e)}")
        return None

def upload_kml_content(kml_content, filename, token):
    """Helper function to upload KML content"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create temporary KML file
        temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.kml', delete=False, encoding='utf-8')
        temp_file.write(kml_content)
        temp_file.close()
        
        # Upload KML file
        with open(temp_file.name, 'rb') as f:
            files = {'file': (filename, f, 'application/vnd.google-earth.kml+xml')}
            response = requests.post(
                f"{BASE_URL}/admin/upload-kml",
                headers=headers,
                files=files,
                timeout=30
            )
        
        # Cleanup temp file
        os.unlink(temp_file.name)
        
        return response
        
    except Exception as e:
        print(f"❌ Upload failed with exception: {str(e)}")
        return None

def test_invalid_coordinates():
    """Test KML with invalid coordinate ranges"""
    print("\n" + "=" * 80)
    print("🧪 TESTING INVALID COORDINATE VALIDATION")
    print("=" * 80)
    
    token = login_admin()
    if not token:
        return False
    
    # KML with coordinates outside valid range
    invalid_kml = '''<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Invalid Coordinates Test</name>
    <Placemark>
      <name>Invalid Location</name>
      <description>This has invalid coordinates</description>
      <Point>
        <coordinates>-200,100,0</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>'''
    
    response = upload_kml_content(invalid_kml, "invalid_coords.kml", token)
    
    if response:
        if response.status_code == 400:
            print("✅ Correctly rejected KML with invalid coordinates")
            return True
        elif response.status_code == 200:
            data = response.json()
            if data.get('total_locations') == 0:
                print("✅ Accepted KML but correctly filtered out invalid coordinates")
                # Cleanup if KML was created
                if data.get('kml_id'):
                    requests.delete(f"{BASE_URL}/admin/kml/{data['kml_id']}", 
                                  headers={"Authorization": f"Bearer {token}"})
                return True
            else:
                print(f"❌ Should have filtered invalid coordinates but found {data.get('total_locations')} locations")
                return False
        else:
            print(f"❌ Unexpected response: {response.status_code}")
            return False
    else:
        print("❌ No response received")
        return False

def test_malformed_xml():
    """Test KML with malformed XML"""
    print("\n" + "=" * 80)
    print("🧪 TESTING MALFORMED XML HANDLING")
    print("=" * 80)
    
    token = login_admin()
    if not token:
        return False
    
    # KML with malformed XML
    malformed_kml = '''<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Malformed Test</name>
    <Placemark>
      <name>Test Location</name>
      <description>This XML has issues</description>
      <Point>
        <coordinates>-46.6333,-23.5505,0</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>
<extra-unclosed-tag>This should cause issues'''
    
    response = upload_kml_content(malformed_kml, "malformed.kml", token)
    
    if response:
        if response.status_code == 400:
            error_detail = response.text
            if "inválido" in error_detail.lower() or "invalid" in error_detail.lower():
                print("✅ Correctly rejected malformed XML KML")
                return True
            else:
                print(f"❌ Rejected but with unexpected error: {error_detail}")
                return False
        else:
            print(f"❌ Should have rejected malformed XML but got: {response.status_code}")
            return False
    else:
        print("❌ No response received")
        return False

def test_non_kml_file():
    """Test uploading non-KML file"""
    print("\n" + "=" * 80)
    print("🧪 TESTING NON-KML FILE REJECTION")
    print("=" * 80)
    
    token = login_admin()
    if not token:
        return False
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create a text file
        text_content = "This is not a KML file, just plain text."
        temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8')
        temp_file.write(text_content)
        temp_file.close()
        
        # Try to upload as KML
        with open(temp_file.name, 'rb') as f:
            files = {'file': ('test.txt', f, 'text/plain')}
            response = requests.post(
                f"{BASE_URL}/admin/upload-kml",
                headers=headers,
                files=files,
                timeout=30
            )
        
        # Cleanup
        os.unlink(temp_file.name)
        
        if response.status_code == 400:
            error_detail = response.text
            if "kml" in error_detail.lower():
                print("✅ Correctly rejected non-KML file (.txt)")
                return True
            else:
                print(f"❌ Rejected but with unexpected error: {error_detail}")
                return False
        else:
            print(f"❌ Should have rejected .txt file but got: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Test failed with exception: {str(e)}")
        return False

def test_utf8_with_accents():
    """Test KML with UTF-8 accented characters"""
    print("\n" + "=" * 80)
    print("🧪 TESTING UTF-8 ENCODING WITH ACCENTS")
    print("=" * 80)
    
    token = login_admin()
    if not token:
        return False
    
    # KML with Portuguese accented characters
    utf8_kml = '''<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Localizações com Acentos</name>
    <Placemark>
      <name>São Paulo</name>
      <description>Localização em São Paulo com acentuação</description>
      <ExtendedData>
        <Data name="região">
          <value>Sudeste</value>
        </Data>
        <Data name="população">
          <value>12.3 milhões</value>
        </Data>
      </ExtendedData>
      <Point>
        <coordinates>-46.6333,-23.5505,0</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>'''
    
    response = upload_kml_content(utf8_kml, "utf8_accents.kml", token)
    
    if response and response.status_code == 200:
        data = response.json()
        
        if data.get('total_locations') == 1:
            locations = data.get('locations', [])
            if locations:
                location = locations[0]
                name = location.get('name', '')
                description = location.get('description', '')
                
                if ("São Paulo" in name and "acentuação" in description and 
                    "região: Sudeste" in description and "milhões" in description):
                    print("✅ Successfully preserved UTF-8 accented characters")
                    
                    # Cleanup
                    requests.delete(f"{BASE_URL}/admin/kml/{data['kml_id']}", 
                                  headers={"Authorization": f"Bearer {token}"})
                    return True
                else:
                    print(f"❌ Accented characters not properly preserved")
                    print(f"   Name: {name}")
                    print(f"   Description: {description}")
                    return False
            else:
                print("❌ No locations found in response")
                return False
        else:
            print(f"❌ Expected 1 location, got {data.get('total_locations')}")
            return False
    else:
        print(f"❌ Upload failed: {response.status_code if response else 'No response'}")
        return False

def test_authentication_requirements():
    """Test that KML endpoints require authentication"""
    print("\n" + "=" * 80)
    print("🧪 TESTING AUTHENTICATION REQUIREMENTS")
    print("=" * 80)
    
    # Test upload without authentication
    simple_kml = '''<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Test</name>
      <Point><coordinates>0,0,0</coordinates></Point>
    </Placemark>
  </Document>
</kml>'''
    
    try:
        temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.kml', delete=False, encoding='utf-8')
        temp_file.write(simple_kml)
        temp_file.close()
        
        # Upload without auth headers
        with open(temp_file.name, 'rb') as f:
            files = {'file': ('test.kml', f, 'application/vnd.google-earth.kml+xml')}
            response = requests.post(f"{BASE_URL}/admin/upload-kml", files=files, timeout=30)
        
        os.unlink(temp_file.name)
        
        if response.status_code in [401, 403]:
            print(f"✅ Upload correctly requires authentication (status {response.status_code})")
        else:
            print(f"❌ Upload should require authentication but got status {response.status_code}")
            return False
        
        # Test locations endpoint without authentication
        response = requests.get(f"{BASE_URL}/kml/locations", timeout=10)
        
        if response.status_code in [401, 403]:
            print(f"✅ Locations correctly requires authentication (status {response.status_code})")
        else:
            print(f"❌ Locations should require authentication but got status {response.status_code}")
            return False
        
        # Test delete without authentication
        response = requests.delete(f"{BASE_URL}/admin/kml/test-id", timeout=10)
        
        if response.status_code in [401, 403]:
            print(f"✅ Delete correctly requires authentication (status {response.status_code})")
            return True
        else:
            print(f"❌ Delete should require authentication but got status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Authentication test failed: {str(e)}")
        return False

def main():
    """Main function to run robustness tests"""
    print("=" * 80)
    print("🚀 KML PARSER ROBUSTNESS TESTING")
    print("=" * 80)
    print("Testing various edge cases and robustness scenarios")
    print()
    
    tests = [
        ("Invalid Coordinates Validation", test_invalid_coordinates),
        ("Malformed XML Handling", test_malformed_xml),
        ("Non-KML File Rejection", test_non_kml_file),
        ("UTF-8 Encoding with Accents", test_utf8_with_accents),
        ("Authentication Requirements", test_authentication_requirements)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
                print(f"✅ {test_name}: PASSED")
            else:
                print(f"❌ {test_name}: FAILED")
        except Exception as e:
            print(f"❌ {test_name}: FAILED with exception: {str(e)}")
    
    print("\n" + "=" * 80)
    print("📊 KML ROBUSTNESS TEST SUMMARY")
    print("=" * 80)
    print(f"Total Tests: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {total - passed}")
    print(f"Success Rate: {(passed/total)*100:.1f}%")
    
    if passed == total:
        print("\n🎉 ALL ROBUSTNESS TESTS PASSED!")
        print("✅ The KML parser demonstrates robust handling of:")
        print("   - Invalid coordinate validation")
        print("   - Malformed XML rejection")
        print("   - Non-KML file rejection")
        print("   - UTF-8 encoding preservation")
        print("   - Proper authentication requirements")
        return True
    else:
        print(f"\n⚠️ {total - passed} ROBUSTNESS TESTS FAILED")
        return False

if __name__ == "__main__":
    main()