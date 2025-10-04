#!/usr/bin/env python3
"""
Debug KML Error Cases
"""

import requests
import tempfile
import os

BASE_URL = "https://pendency-hub.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

def login_admin():
    response = requests.post(
        f"{BASE_URL}/login",
        json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
        timeout=10
    )
    if response.status_code == 200:
        return response.json()["access_token"]
    return None

def test_invalid_coordinates():
    token = login_admin()
    if not token:
        print("Failed to login")
        return
    
    kml_content = '''<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Invalid Location</name>
      <description>This has invalid coordinates</description>
      <Point>
        <coordinates>-200.0,100.0,0</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>'''
    
    temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.kml', delete=False, encoding='utf-8')
    temp_file.write(kml_content)
    temp_file.close()
    
    try:
        with open(temp_file.name, 'rb') as f:
            files = {'file': (os.path.basename(temp_file.name), f, 'application/vnd.google-earth.kml+xml')}
            response = requests.post(
                f"{BASE_URL}/admin/upload-kml",
                headers={"Authorization": f"Bearer {token}"},
                files=files,
                timeout=30
            )
        
        print(f"Invalid coordinates test:")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        os.unlink(temp_file.name)

def test_invalid_xml():
    token = login_admin()
    if not token:
        print("Failed to login")
        return
    
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
    
    temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.kml', delete=False, encoding='utf-8')
    temp_file.write(kml_content)
    temp_file.close()
    
    try:
        with open(temp_file.name, 'rb') as f:
            files = {'file': (os.path.basename(temp_file.name), f, 'application/vnd.google-earth.kml+xml')}
            response = requests.post(
                f"{BASE_URL}/admin/upload-kml",
                headers={"Authorization": f"Bearer {token}"},
                files=files,
                timeout=30
            )
        
        print(f"\nInvalid XML test:")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        os.unlink(temp_file.name)

def test_non_kml_file():
    token = login_admin()
    if not token:
        print("Failed to login")
        return
    
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
        
        print(f"\nNon-KML file test:")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        os.unlink(temp_file.name)

if __name__ == "__main__":
    test_invalid_coordinates()
    test_invalid_xml()
    test_non_kml_file()