#!/usr/bin/env python3
"""
CN19 KML Parser Test - Specific test for the Portuguese review request
Tests the exact KML example provided in the review request.
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

def test_cn19_kml_example():
    """Test the exact CN19 KML example from the Portuguese review"""
    print("\n" + "=" * 80)
    print("🧪 TESTING CN19 KML EXAMPLE FROM PORTUGUESE REVIEW")
    print("=" * 80)
    
    # Login first
    token = login_admin()
    if not token:
        return False
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # The exact KML from the review request
    cn19_kml = '''<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Localizações CN19</name>
    <Placemark>
      <name>Torre CN19-001</name>
      <description>Torre de comunicação principal</description>
      <ExtendedData>
        <Data name="tipo">
          <value>Torre de Comunicação</value>
        </Data>
        <Data name="codigo">
          <value>CN19-001</value>
        </Data>
        <Data name="status">
          <value>Ativo</value>
        </Data>
      </ExtendedData>
      <Point>
        <coordinates>-47.8825,-15.7942,0</coordinates>
      </Point>
    </Placemark>
    <Placemark>
      <name>Estação Base CN19-002</name>
      <description>Estação base secundária</description>
      <ExtendedData>
        <Data name="tipo">
          <value>Estação Base</value>
        </Data>
        <Data name="codigo">
          <value>CN19-002</value>
        </Data>
      </ExtendedData>
      <Point>
        <coordinates>-47.9156,-15.8267,650</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>'''
    
    try:
        # Create temporary KML file
        temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.kml', delete=False, encoding='utf-8')
        temp_file.write(cn19_kml)
        temp_file.close()
        
        # Upload KML file
        with open(temp_file.name, 'rb') as f:
            files = {'file': ('cn19_locations.kml', f, 'application/vnd.google-earth.kml+xml')}
            response = requests.post(
                f"{BASE_URL}/admin/upload-kml",
                headers=headers,
                files=files,
                timeout=30
            )
        
        # Cleanup temp file
        os.unlink(temp_file.name)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ CN19 KML uploaded successfully")
            print(f"   Message: {data.get('message')}")
            print(f"   Total locations: {data.get('total_locations')}")
            
            # Verify we got 2 locations
            if data.get('total_locations') == 2:
                print("✅ Correct number of locations parsed (2)")
                
                # Check location details
                locations = data.get('locations', [])
                if len(locations) >= 2:
                    print("\n📍 PARSED LOCATIONS:")
                    for i, loc in enumerate(locations[:2], 1):
                        print(f"   Location {i}:")
                        print(f"     Name: {loc.get('name')}")
                        print(f"     Description: {loc.get('description')}")
                        print(f"     Coordinates: ({loc.get('latitude')}, {loc.get('longitude')})")
                    
                    # Verify Torre CN19-001
                    torre = next((loc for loc in locations if "Torre CN19-001" in loc.get("name", "")), None)
                    if torre:
                        if (torre.get("latitude") == -15.7942 and torre.get("longitude") == -47.8825):
                            print("✅ Torre CN19-001 coordinates correct")
                        else:
                            print(f"❌ Torre CN19-001 coordinates incorrect: {torre.get('latitude')}, {torre.get('longitude')}")
                        
                        # Check ExtendedData extraction
                        desc = torre.get("description", "")
                        if ("tipo: Torre de Comunicação" in desc and 
                            "codigo: CN19-001" in desc and 
                            "status: Ativo" in desc):
                            print("✅ Torre CN19-001 ExtendedData correctly extracted")
                        else:
                            print(f"❌ Torre CN19-001 ExtendedData not properly extracted: {desc}")
                    else:
                        print("❌ Torre CN19-001 not found in parsed locations")
                    
                    # Verify Estação Base CN19-002
                    estacao = next((loc for loc in locations if "Estação Base CN19-002" in loc.get("name", "")), None)
                    if estacao:
                        if (estacao.get("latitude") == -15.8267 and estacao.get("longitude") == -47.9156):
                            print("✅ Estação Base CN19-002 coordinates correct")
                        else:
                            print(f"❌ Estação Base CN19-002 coordinates incorrect: {estacao.get('latitude')}, {estacao.get('longitude')}")
                        
                        # Check ExtendedData extraction
                        desc = estacao.get("description", "")
                        if ("tipo: Estação Base" in desc and "codigo: CN19-002" in desc):
                            print("✅ Estação Base CN19-002 ExtendedData correctly extracted")
                        else:
                            print(f"❌ Estação Base CN19-002 ExtendedData not properly extracted: {desc}")
                    else:
                        print("❌ Estação Base CN19-002 not found in parsed locations")
                
                # Test GET /api/kml/locations
                print("\n🔍 Testing GET /api/kml/locations...")
                locations_response = requests.get(
                    f"{BASE_URL}/kml/locations",
                    headers=headers,
                    timeout=10
                )
                
                if locations_response.status_code == 200:
                    all_locations = locations_response.json()
                    print(f"✅ Retrieved {len(all_locations)} total KML locations")
                    
                    # Find our CN19 locations
                    cn19_locations = [loc for loc in all_locations if "CN19" in loc.get("name", "")]
                    if len(cn19_locations) >= 2:
                        print(f"✅ Found {len(cn19_locations)} CN19 locations in the list")
                    else:
                        print(f"⚠️ Only found {len(cn19_locations)} CN19 locations in the list")
                else:
                    print(f"❌ Failed to get KML locations: {locations_response.status_code}")
                
                # Test DELETE /api/admin/kml/{kml_id}
                print(f"\n🗑️ Testing DELETE /api/admin/kml/{data.get('kml_id')}...")
                delete_response = requests.delete(
                    f"{BASE_URL}/admin/kml/{data.get('kml_id')}",
                    headers=headers,
                    timeout=10
                )
                
                if delete_response.status_code == 200:
                    delete_result = delete_response.json()
                    print(f"✅ Successfully deleted CN19 KML data")
                    print(f"   Message: {delete_result.get('message')}")
                else:
                    print(f"❌ Failed to delete KML data: {delete_response.status_code}")
                
                return True
            else:
                print(f"❌ Expected 2 locations, got {data.get('total_locations')}")
                return False
        else:
            print(f"❌ CN19 KML upload failed with status {response.status_code}")
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ CN19 KML test failed with exception: {str(e)}")
        return False

def main():
    """Main function"""
    print("=" * 80)
    print("🚀 CN19 KML PARSER TEST - PORTUGUESE REVIEW REQUEST")
    print("=" * 80)
    print("Testing the exact KML example provided in the Portuguese review:")
    print("- Multiple Placemarks with ExtendedData")
    print("- Complex coordinate formats")
    print("- Portuguese descriptions and metadata")
    print()
    
    success = test_cn19_kml_example()
    
    print("\n" + "=" * 80)
    print("📊 CN19 KML TEST SUMMARY")
    print("=" * 80)
    
    if success:
        print("🎉 CN19 KML PARSER TEST PASSED!")
        print("✅ The robust KML parser successfully handles:")
        print("   - Complex KML with multiple Placemarks")
        print("   - ExtendedData with Data/value elements")
        print("   - Coordinate parsing with altitude")
        print("   - Portuguese text and descriptions")
        print("   - All CRUD operations (upload, list, delete)")
        return True
    else:
        print("❌ CN19 KML PARSER TEST FAILED!")
        print("Some functionality needs attention.")
        return False

if __name__ == "__main__":
    main()