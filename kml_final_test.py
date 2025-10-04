#!/usr/bin/env python3
"""
Final KML Parser Testing Script - Simplified and Robust
Tests the enhanced KML parser functionality as requested
"""

import requests
import json
import tempfile
import os
from datetime import datetime

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
            return response.json()["access_token"]
    except:
        pass
    return None

def test_kml_upload(kml_content, filename, test_name):
    """Test KML upload with given content"""
    token = login_admin()
    if not token:
        print(f"❌ FAIL {test_name}: Failed to login")
        return None, None
    
    # Create temp file
    temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.kml', delete=False, encoding='utf-8')
    temp_file.write(kml_content)
    temp_file.close()
    
    try:
        with open(temp_file.name, 'rb') as f:
            files = {'file': (filename, f, 'application/vnd.google-earth.kml+xml')}
            response = requests.post(
                f"{BASE_URL}/admin/upload-kml",
                headers={"Authorization": f"Bearer {token}"},
                files=files,
                timeout=30
            )
        return response.status_code, response.text
    except Exception as e:
        print(f"❌ FAIL {test_name}: Request failed - {str(e)}")
        return None, None
    finally:
        if os.path.exists(temp_file.name):
            os.unlink(temp_file.name)

def test_non_kml_file():
    """Test non-KML file upload"""
    token = login_admin()
    if not token:
        print("❌ FAIL Non-KML File: Failed to login")
        return False
    
    # Create temp txt file
    temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8')
    temp_file.write("This is not a KML file")
    temp_file.close()
    
    try:
        with open(temp_file.name, 'rb') as f:
            files = {'file': (os.path.basename(temp_file.name), f, 'text/plain')}
            response = requests.post(
                f"{BASE_URL}/admin/upload-kml",
                headers={"Authorization": f"Bearer {token}"},
                files=files,
                timeout=30
            )
        
        if response.status_code == 400 and "kml" in response.text.lower():
            print("✅ PASS Non-KML File: Correctly rejected non-KML file")
            return True
        else:
            print(f"❌ FAIL Non-KML File: Expected 400 with KML error, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ FAIL Non-KML File: Request failed - {str(e)}")
        return False
    finally:
        if os.path.exists(temp_file.name):
            os.unlink(temp_file.name)

def run_kml_tests():
    """Run all KML parser tests"""
    print("🚀 ENHANCED KML PARSER TESTING")
    print("=" * 60)
    
    results = []
    
    # Test 1: Simple KML - Brasília
    print("\n🧪 TEST 1: Simple KML - Brasília")
    kml_content = '''<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Brasília</name>
      <description>Capital do Brasil</description>
      <Point>
        <coordinates>-47.8825,-15.7942,0</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>'''
    
    status, response = test_kml_upload(kml_content, "brasilia.kml", "Simple KML")
    if status == 200:
        data = json.loads(response)
        if (data.get("total_locations") == 1 and 
            data["locations"][0].get("name") == "Brasília"):
            print("✅ PASS: Successfully parsed simple KML with correct data")
            results.append(True)
        else:
            print("❌ FAIL: Data validation failed")
            results.append(False)
    else:
        print(f"❌ FAIL: Expected 200, got {status}")
        results.append(False)
    
    # Test 2: KML with ExtendedData
    print("\n🧪 TEST 2: KML with ExtendedData")
    kml_content = '''<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Local Teste</name>
      <ExtendedData>
        <Data name="tipo">
          <value>Torre</value>
        </Data>
        <Data name="codigo">
          <value>CN19-001</value>
        </Data>
      </ExtendedData>
      <Point>
        <coordinates>-47.123,-15.456</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>'''
    
    status, response = test_kml_upload(kml_content, "extended_data.kml", "ExtendedData KML")
    if status == 200:
        data = json.loads(response)
        if (data.get("total_locations") == 1 and 
            "tipo: Torre" in data["locations"][0].get("description", "") and
            "codigo: CN19-001" in data["locations"][0].get("description", "")):
            print("✅ PASS: Successfully parsed KML with ExtendedData")
            results.append(True)
        else:
            print("❌ FAIL: ExtendedData not properly parsed")
            results.append(False)
    else:
        print(f"❌ FAIL: Expected 200, got {status}")
        results.append(False)
    
    # Test 3: Multiple Placemarks
    print("\n🧪 TEST 3: Multiple Placemarks")
    kml_content = '''<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Rio de Janeiro</name>
      <Point>
        <coordinates>-43.1729,-22.9068,0</coordinates>
      </Point>
    </Placemark>
    <Placemark>
      <name>São Paulo</name>
      <Point>
        <coordinates>-46.6333,-23.5505</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>'''
    
    status, response = test_kml_upload(kml_content, "multiple.kml", "Multiple Placemarks")
    if status == 200:
        data = json.loads(response)
        if data.get("total_locations") == 2:
            names = [loc.get("name") for loc in data["locations"]]
            if "Rio de Janeiro" in names and "São Paulo" in names:
                print("✅ PASS: Successfully parsed multiple placemarks")
                results.append(True)
            else:
                print("❌ FAIL: Missing expected location names")
                results.append(False)
        else:
            print(f"❌ FAIL: Expected 2 locations, got {data.get('total_locations')}")
            results.append(False)
    else:
        print(f"❌ FAIL: Expected 200, got {status}")
        results.append(False)
    
    # Test 4: Invalid Coordinates
    print("\n🧪 TEST 4: Invalid Coordinates Validation")
    kml_content = '''<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Invalid Location</name>
      <Point>
        <coordinates>-200.0,100.0,0</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>'''
    
    status, response = test_kml_upload(kml_content, "invalid_coords.kml", "Invalid Coordinates")
    if status == 500 and "Nenhuma localização válida encontrada" in response:
        print("✅ PASS: Correctly rejected invalid coordinates")
        results.append(True)
    else:
        print(f"❌ FAIL: Expected 500 with validation error, got {status}")
        results.append(False)
    
    # Test 5: Invalid XML
    print("\n🧪 TEST 5: Invalid XML Structure")
    kml_content = '''<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Broken XML</name>
      <description>This XML is malformed
      <Point>
        <coordinates>-47.8825,-15.7942,0</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>'''
    
    status, response = test_kml_upload(kml_content, "invalid_xml.kml", "Invalid XML")
    if status == 400 and ("inválido" in response.lower() or "mismatched tag" in response):
        print("✅ PASS: Correctly rejected malformed XML")
        results.append(True)
    else:
        print(f"❌ FAIL: Expected 400 with XML error, got {status}")
        results.append(False)
    
    # Test 6: Non-KML File
    print("\n🧪 TEST 6: Non-KML File Extension")
    if test_non_kml_file():
        results.append(True)
    else:
        results.append(False)
    
    # Test 7: UTF-8 with Accents
    print("\n🧪 TEST 7: UTF-8 Encoding with Accents")
    kml_content = '''<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Localização com Acentos</name>
      <description>São Paulo, Brasília, João Pessoa</description>
      <Point>
        <coordinates>-46.6333,-23.5505,0</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>'''
    
    status, response = test_kml_upload(kml_content, "accents.kml", "UTF-8 Accents")
    if status == 200:
        data = json.loads(response)
        if (data.get("total_locations") == 1 and 
            "Localização com Acentos" in data["locations"][0].get("name", "") and
            "São Paulo" in data["locations"][0].get("description", "")):
            print("✅ PASS: Successfully parsed UTF-8 with accents")
            results.append(True)
        else:
            print("❌ FAIL: Accented characters not preserved")
            results.append(False)
    else:
        print(f"❌ FAIL: Expected 200, got {status}")
        results.append(False)
    
    # Test 8: Get KML Locations
    print("\n🧪 TEST 8: Get KML Locations Endpoint")
    token = login_admin()
    if token:
        try:
            response = requests.get(
                f"{BASE_URL}/kml/locations",
                headers={"Authorization": f"Bearer {token}"},
                timeout=10
            )
            if response.status_code == 200:
                locations = response.json()
                if isinstance(locations, list):
                    print(f"✅ PASS: Retrieved {len(locations)} KML locations")
                    results.append(True)
                else:
                    print("❌ FAIL: Response should be a list")
                    results.append(False)
            else:
                print(f"❌ FAIL: Expected 200, got {response.status_code}")
                results.append(False)
        except Exception as e:
            print(f"❌ FAIL: Request failed - {str(e)}")
            results.append(False)
    else:
        print("❌ FAIL: Failed to login")
        results.append(False)
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 KML PARSER TEST SUMMARY")
    print("=" * 60)
    
    total_tests = len(results)
    passed_tests = sum(results)
    failed_tests = total_tests - passed_tests
    
    print(f"Total Tests: {total_tests}")
    print(f"Passed: {passed_tests} ✅")
    print(f"Failed: {failed_tests} ❌")
    print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
    
    return failed_tests == 0

if __name__ == "__main__":
    success = run_kml_tests()
    if success:
        print("\n🎉 ALL KML PARSER TESTS PASSED!")
    else:
        print("\n💥 SOME KML PARSER TESTS FAILED!")