#!/usr/bin/env python3
"""
KML Parser Robustness Testing Script
Tests the enhanced KML parser with complex KML files as requested in Portuguese review.

Objetivo: Verificar se o parser KML melhorado consegue processar arquivos KML reais corretamente

Testa:
1. POST /api/admin/upload-kml - Upload e parsing de KML
2. GET /api/kml/locations - Listar localizações importadas  
3. DELETE /api/admin/kml/{kml_id} - Excluir dados KML
4. KML complexo com múltiplos Placemarks, ExtendedData, diferentes formatos
"""

import requests
import json
import sys
import tempfile
import os
from datetime import datetime

# Configuration
BASE_URL = "https://pendency-hub.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

class KMLParserTester:
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
    
    def create_kml_file(self, content, filename):
        """Create a temporary KML file with given content"""
        try:
            temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.kml', delete=False, encoding='utf-8')
            temp_file.write(content)
            temp_file.close()
            return temp_file.name
        except Exception as e:
            self.log_test("Create KML File", False, f"Failed to create KML file: {str(e)}")
            return None
    
    def upload_kml_file(self, file_path, test_name):
        """Upload KML file to the server"""
        try:
            with open(file_path, 'rb') as f:
                files = {'file': (os.path.basename(file_path), f, 'application/vnd.google-earth.kml+xml')}
                response = requests.post(
                    f"{self.base_url}/admin/upload-kml",
                    headers=self.get_auth_headers(),
                    files=files,
                    timeout=30
                )
            
            return response
            
        except requests.exceptions.RequestException as e:
            self.log_test(test_name, False, f"Upload request failed: {str(e)}")
            return None
        except Exception as e:
            self.log_test(test_name, False, f"Unexpected error: {str(e)}")
            return None
        finally:
            # Clean up temp file
            if os.path.exists(file_path):
                os.unlink(file_path)
    
    def test_simple_kml_brasilia(self):
        """Test 1 - Simple KML with Brasília location"""
        print("\n" + "=" * 80)
        print("🧪 TEST 1: SIMPLE KML - BRASÍLIA")
        print("=" * 80)
        
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
        
        try:
            file_path = self.create_kml_file(kml_content, "brasilia_simple.kml")
            if not file_path:
                return False
            
            response = self.upload_kml_file(file_path, "Simple KML - Brasília")
            
            if response and response.status_code == 200:
                data = response.json()
                
                # Validate response structure
                required_fields = ["message", "kml_id", "total_locations", "locations"]
                if all(field in data for field in required_fields):
                    
                    # Check location count
                    if data["total_locations"] == 1:
                        
                        # Check location data
                        location = data["locations"][0]
                        expected_fields = ["name", "description", "latitude", "longitude"]
                        
                        if all(field in location for field in expected_fields):
                            # Validate specific values
                            if (location["name"] == "Brasília" and 
                                location["description"] == "Capital do Brasil" and
                                abs(location["latitude"] - (-15.7942)) < 0.001 and
                                abs(location["longitude"] - (-47.8825)) < 0.001):
                                
                                self.log_test("Simple KML - Brasília", True, 
                                            "Successfully parsed simple KML with correct data",
                                            f"Name: {location['name']}, Coords: ({location['latitude']}, {location['longitude']})")
                                return data["kml_id"]
                            else:
                                self.log_test("Simple KML - Brasília", False, 
                                            "Location data doesn't match expected values", location)
                                return None
                        else:
                            self.log_test("Simple KML - Brasília", False, 
                                        "Missing required fields in location data", location)
                            return None
                    else:
                        self.log_test("Simple KML - Brasília", False, 
                                    f"Expected 1 location but got {data['total_locations']}")
                        return None
                else:
                    self.log_test("Simple KML - Brasília", False, 
                                "Missing required fields in response", data)
                    return None
            else:
                error_msg = response.text if response else "No response"
                status_code = response.status_code if response else "No status"
                self.log_test("Simple KML - Brasília", False, 
                            f"Upload failed with status {status_code}", error_msg)
                return None
                
        except Exception as e:
            self.log_test("Simple KML - Brasília", False, f"Test failed with exception: {str(e)}")
            return None
    
    def test_kml_with_extended_data(self):
        """Test 2 - KML with ExtendedData"""
        print("\n" + "=" * 80)
        print("🧪 TEST 2: KML WITH EXTENDED DATA")
        print("=" * 80)
        
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
        
        try:
            file_path = self.create_kml_file(kml_content, "extended_data.kml")
            if not file_path:
                return False
            
            response = self.upload_kml_file(file_path, "KML with ExtendedData")
            
            if response and response.status_code == 200:
                data = response.json()
                
                if data.get("total_locations") == 1:
                    location = data["locations"][0]
                    
                    # Check basic fields
                    if (location.get("name") == "Local Teste" and
                        abs(location.get("latitude", 0) - (-15.456)) < 0.001 and
                        abs(location.get("longitude", 0) - (-47.123)) < 0.001):
                        
                        # Check if ExtendedData was parsed into description
                        description = location.get("description", "")
                        if "tipo: Torre" in description and "codigo: CN19-001" in description:
                            self.log_test("KML with ExtendedData", True, 
                                        "Successfully parsed KML with ExtendedData",
                                        f"Name: {location['name']}, Extended data in description: {description}")
                            return data["kml_id"]
                        else:
                            self.log_test("KML with ExtendedData", False, 
                                        "ExtendedData not properly parsed into description", 
                                        f"Description: {description}")
                            return None
                    else:
                        self.log_test("KML with ExtendedData", False, 
                                    "Basic location data incorrect", location)
                        return None
                else:
                    self.log_test("KML with ExtendedData", False, 
                                f"Expected 1 location but got {data.get('total_locations')}")
                    return None
            else:
                error_msg = response.text if response else "No response"
                status_code = response.status_code if response else "No status"
                self.log_test("KML with ExtendedData", False, 
                            f"Upload failed with status {status_code}", error_msg)
                return None
                
        except Exception as e:
            self.log_test("KML with ExtendedData", False, f"Test failed with exception: {str(e)}")
            return None
    
    def test_kml_different_coordinate_formats(self):
        """Test 3 - Different coordinate formats"""
        print("\n" + "=" * 80)
        print("🧪 TEST 3: DIFFERENT COORDINATE FORMATS")
        print("=" * 80)
        
        # Test with coordinates without altitude
        kml_content = '''<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>São Paulo</name>
      <description>Maior cidade do Brasil</description>
      <Point>
        <coordinates>-46.6333,-23.5505</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>'''
        
        try:
            file_path = self.create_kml_file(kml_content, "different_coords.kml")
            if not file_path:
                return False
            
            response = self.upload_kml_file(file_path, "Different Coordinate Formats")
            
            if response and response.status_code == 200:
                data = response.json()
                
                if data.get("total_locations") == 1:
                    location = data["locations"][0]
                    
                    # Check coordinates parsing (without altitude)
                    if (location.get("name") == "São Paulo" and
                        abs(location.get("latitude", 0) - (-23.5505)) < 0.001 and
                        abs(location.get("longitude", 0) - (-46.6333)) < 0.001):
                        
                        self.log_test("Different Coordinate Formats", True, 
                                    "Successfully parsed coordinates without altitude",
                                    f"Coords: ({location['latitude']}, {location['longitude']})")
                        return data["kml_id"]
                    else:
                        self.log_test("Different Coordinate Formats", False, 
                                    "Coordinate parsing failed", location)
                        return None
                else:
                    self.log_test("Different Coordinate Formats", False, 
                                f"Expected 1 location but got {data.get('total_locations')}")
                    return None
            else:
                error_msg = response.text if response else "No response"
                status_code = response.status_code if response else "No status"
                self.log_test("Different Coordinate Formats", False, 
                            f"Upload failed with status {status_code}", error_msg)
                return None
                
        except Exception as e:
            self.log_test("Different Coordinate Formats", False, f"Test failed with exception: {str(e)}")
            return None
    
    def test_kml_multiple_placemarks(self):
        """Test 4 - Multiple Placemarks in one KML"""
        print("\n" + "=" * 80)
        print("🧪 TEST 4: MULTIPLE PLACEMARKS")
        print("=" * 80)
        
        kml_content = '''<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Rio de Janeiro</name>
      <description>Cidade Maravilhosa</description>
      <Point>
        <coordinates>-43.1729,-22.9068,0</coordinates>
      </Point>
    </Placemark>
    <Placemark>
      <name>Belo Horizonte</name>
      <description>Capital de Minas Gerais</description>
      <Point>
        <coordinates>-43.9378,-19.9208,0</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>'''
        
        try:
            file_path = self.create_kml_file(kml_content, "multiple_placemarks.kml")
            if not file_path:
                return False
            
            response = self.upload_kml_file(file_path, "Multiple Placemarks")
            
            if response and response.status_code == 200:
                data = response.json()
                
                if data.get("total_locations") == 2:
                    locations = data["locations"]
                    
                    # Check if both locations are present
                    names = [loc.get("name") for loc in locations]
                    if "Rio de Janeiro" in names and "Belo Horizonte" in names:
                        
                        # Validate coordinates for both
                        rio_location = next((loc for loc in locations if loc.get("name") == "Rio de Janeiro"), None)
                        bh_location = next((loc for loc in locations if loc.get("name") == "Belo Horizonte"), None)
                        
                        if (rio_location and bh_location and
                            abs(rio_location.get("latitude", 0) - (-22.9068)) < 0.001 and
                            abs(bh_location.get("latitude", 0) - (-19.9208)) < 0.001):
                            
                            self.log_test("Multiple Placemarks", True, 
                                        "Successfully parsed multiple placemarks",
                                        f"Found: {names}")
                            return data["kml_id"]
                        else:
                            self.log_test("Multiple Placemarks", False, 
                                        "Coordinate validation failed for multiple placemarks")
                            return None
                    else:
                        self.log_test("Multiple Placemarks", False, 
                                    f"Expected Rio de Janeiro and Belo Horizonte but got: {names}")
                        return None
                else:
                    self.log_test("Multiple Placemarks", False, 
                                f"Expected 2 locations but got {data.get('total_locations')}")
                    return None
            else:
                error_msg = response.text if response else "No response"
                status_code = response.status_code if response else "No status"
                self.log_test("Multiple Placemarks", False, 
                            f"Upload failed with status {status_code}", error_msg)
                return None
                
        except Exception as e:
            self.log_test("Multiple Placemarks", False, f"Test failed with exception: {str(e)}")
            return None
    
    def test_kml_invalid_coordinates(self):
        """Test 5 - Invalid coordinates (out of range)"""
        print("\n" + "=" * 80)
        print("🧪 TEST 5: INVALID COORDINATES VALIDATION")
        print("=" * 80)
        
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
        
        try:
            file_path = self.create_kml_file(kml_content, "invalid_coords.kml")
            if not file_path:
                return False
            
            response = self.upload_kml_file(file_path, "Invalid Coordinates")
            
            if response and response.status_code == 500:
                # Server returns 500 when no valid locations found
                error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {"detail": response.text}
                if "Nenhuma localização válida encontrada" in error_data.get("detail", ""):
                    self.log_test("Invalid Coordinates Validation", True, 
                                "Correctly rejected KML with invalid coordinates",
                                f"Error: No valid locations found")
                    return True
                else:
                    self.log_test("Invalid Coordinates Validation", False, 
                                "Unexpected error message", error_data)
                    return False
            elif response and response.status_code == 400:
                # Should reject invalid coordinates
                self.log_test("Invalid Coordinates Validation", True, 
                            "Correctly rejected KML with invalid coordinates",
                            f"Status: {response.status_code}")
                return True
            elif response and response.status_code == 200:
                # If it accepts, check if it filtered out invalid coordinates
                data = response.json()
                if data.get("total_locations") == 0:
                    self.log_test("Invalid Coordinates Validation", True, 
                                "Correctly filtered out invalid coordinates",
                                "No locations found due to invalid coordinates")
                    return True
                else:
                    self.log_test("Invalid Coordinates Validation", False, 
                                "Should have rejected or filtered invalid coordinates", data)
                    return False
            else:
                error_msg = response.text if response else "No response"
                status_code = response.status_code if response else "No status"
                self.log_test("Invalid Coordinates Validation", False, 
                            f"Unexpected response: {status_code}", error_msg)
                return False
                
        except Exception as e:
            self.log_test("Invalid Coordinates Validation", False, f"Test failed with exception: {str(e)}")
            return False
    
    def test_kml_invalid_xml(self):
        """Test 6 - Invalid XML structure"""
        print("\n" + "=" * 80)
        print("🧪 TEST 6: INVALID XML STRUCTURE")
        print("=" * 80)
        
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
        
        try:
            file_path = self.create_kml_file(kml_content, "invalid_xml.kml")
            if not file_path:
                return False
            
            response = self.upload_kml_file(file_path, "Invalid XML")
            
            if response and response.status_code == 400:
                # Should reject malformed XML
                error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {"detail": response.text}
                detail = error_data.get("detail", "").lower()
                if ("inválido" in detail or "invalid" in detail or 
                    "corrompido" in detail or "mismatched tag" in detail):
                    self.log_test("Invalid XML Structure", True, 
                                "Correctly rejected malformed XML",
                                f"Error: XML parsing error detected")
                    return True
                else:
                    self.log_test("Invalid XML Structure", False, 
                                "Rejected but with unexpected error message", error_data)
                    return False
            else:
                error_msg = response.text if response else "No response"
                status_code = response.status_code if response else "No status"
                self.log_test("Invalid XML Structure", False, 
                            f"Should have rejected malformed XML but got: {status_code}", error_msg)
                return False
                
        except Exception as e:
            self.log_test("Invalid XML Structure", False, f"Test failed with exception: {str(e)}")
            return False
    
    def test_kml_non_kml_file(self):
        """Test 7 - Non-KML file extension"""
        print("\n" + "=" * 80)
        print("🧪 TEST 7: NON-KML FILE EXTENSION")
        print("=" * 80)
        
        try:
            # Create a file with .txt extension
            temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8')
            temp_file.write("This is not a KML file")
            temp_file.close()
            
            try:
                with open(temp_file.name, 'rb') as f:
                    files = {'file': (os.path.basename(temp_file.name), f, 'text/plain')}
                    response = requests.post(
                        f"{self.base_url}/admin/upload-kml",
                        headers=self.get_auth_headers(),
                        files=files,
                        timeout=30
                    )
                
                if response and response.status_code == 400:
                    error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {"detail": response.text}
                    if "kml" in error_data.get("detail", "").lower():
                        self.log_test("Non-KML File Extension", True, 
                                    "Correctly rejected non-KML file",
                                    f"Error: {error_data.get('detail')}")
                        return True
                    else:
                        self.log_test("Non-KML File Extension", False, 
                                    "Rejected but with unexpected error message", error_data)
                        return False
                else:
                    error_msg = response.text if response else "No response"
                    status_code = response.status_code if response else "No status"
                    self.log_test("Non-KML File Extension", False, 
                                f"Should have rejected non-KML file but got: {status_code}", error_msg)
                    return False
            finally:
                # Clean up
                if os.path.exists(temp_file.name):
                    os.unlink(temp_file.name)
                
        except Exception as e:
            self.log_test("Non-KML File Extension", False, f"Test failed with exception: {str(e)}")
            return False
    
    def test_kml_encoding_utf8_bom(self):
        """Test 8 - UTF-8 with BOM encoding"""
        print("\n" + "=" * 80)
        print("🧪 TEST 8: UTF-8 WITH BOM ENCODING")
        print("=" * 80)
        
        kml_content = '''<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Localização com Acentos</name>
      <description>Teste de codificação UTF-8 com BOM - São Paulo, Brasília, João Pessoa</description>
      <Point>
        <coordinates>-46.6333,-23.5505,0</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>'''
        
        try:
            # Create file with BOM
            temp_file = tempfile.NamedTemporaryFile(mode='wb', suffix='.kml', delete=False)
            # Add BOM (Byte Order Mark) for UTF-8
            bom_content = '\ufeff' + kml_content
            temp_file.write(bom_content.encode('utf-8-sig'))
            temp_file.close()
            
            response = self.upload_kml_file(temp_file.name, "UTF-8 with BOM")
            
            if response and response.status_code == 200:
                data = response.json()
                
                if data.get("total_locations") == 1:
                    location = data["locations"][0]
                    
                    # Check if accented characters were preserved
                    if (location.get("name") == "Localização com Acentos" and
                        "São Paulo" in location.get("description", "") and
                        "Brasília" in location.get("description", "")):
                        
                        self.log_test("UTF-8 with BOM Encoding", True, 
                                    "Successfully parsed UTF-8 with BOM and preserved accents",
                                    f"Name: {location['name']}")
                        return data["kml_id"]
                    else:
                        self.log_test("UTF-8 with BOM Encoding", False, 
                                    "Accented characters not properly preserved", location)
                        return None
                else:
                    self.log_test("UTF-8 with BOM Encoding", False, 
                                f"Expected 1 location but got {data.get('total_locations')}")
                    return None
            else:
                error_msg = response.text if response else "No response"
                status_code = response.status_code if response else "No status"
                self.log_test("UTF-8 with BOM Encoding", False, 
                            f"Upload failed with status {status_code}", error_msg)
                return None
                
        except Exception as e:
            self.log_test("UTF-8 with BOM Encoding", False, f"Test failed with exception: {str(e)}")
            return None
    
    def test_get_kml_locations(self):
        """Test GET /api/kml/locations endpoint"""
        print("\n" + "=" * 80)
        print("🧪 TEST 9: GET KML LOCATIONS")
        print("=" * 80)
        
        try:
            response = requests.get(
                f"{self.base_url}/kml/locations",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                locations = response.json()
                
                if isinstance(locations, list):
                    if len(locations) > 0:
                        # Check structure of locations
                        sample_location = locations[0]
                        required_fields = ["name", "latitude", "longitude", "source_file", "uploaded_by"]
                        
                        if all(field in sample_location for field in required_fields):
                            self.log_test("Get KML Locations", True, 
                                        f"Successfully retrieved {len(locations)} KML locations",
                                        f"Sample: {sample_location['name']} from {sample_location['source_file']}")
                            return True
                        else:
                            self.log_test("Get KML Locations", False, 
                                        "Missing required fields in location data", sample_location)
                            return False
                    else:
                        self.log_test("Get KML Locations", True, 
                                    "Successfully retrieved KML locations (empty list)")
                        return True
                else:
                    self.log_test("Get KML Locations", False, 
                                "Response should be a list", locations)
                    return False
            else:
                self.log_test("Get KML Locations", False, 
                            f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Get KML Locations", False, f"Request failed: {str(e)}")
            return False
    
    def test_delete_kml_data(self, kml_id):
        """Test DELETE /api/admin/kml/{kml_id} endpoint"""
        if not kml_id:
            self.log_test("Delete KML Data", False, "No KML ID provided for deletion")
            return False
        
        try:
            response = requests.delete(
                f"{self.base_url}/admin/kml/{kml_id}",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                if "message" in result:
                    self.log_test("Delete KML Data", True, 
                                f"Successfully deleted KML data {kml_id}",
                                f"Message: {result['message']}")
                    return True
                else:
                    self.log_test("Delete KML Data", False, 
                                "No success message in response", result)
                    return False
            else:
                self.log_test("Delete KML Data", False, 
                            f"Delete failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Delete KML Data", False, f"Request failed: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all KML parser tests"""
        print("🚀 STARTING ENHANCED KML PARSER TESTING")
        print("=" * 80)
        
        # Login first
        if not self.login_admin():
            print("❌ Failed to login as admin. Cannot proceed with tests.")
            return False
        
        # Track KML IDs for cleanup
        kml_ids_to_cleanup = []
        
        # Test 1: Simple KML
        kml_id = self.test_simple_kml_brasilia()
        if kml_id:
            kml_ids_to_cleanup.append(kml_id)
        
        # Test 2: KML with ExtendedData
        kml_id = self.test_kml_with_extended_data()
        if kml_id:
            kml_ids_to_cleanup.append(kml_id)
        
        # Test 3: Different coordinate formats
        kml_id = self.test_kml_different_coordinate_formats()
        if kml_id:
            kml_ids_to_cleanup.append(kml_id)
        
        # Test 4: Multiple placemarks
        kml_id = self.test_kml_multiple_placemarks()
        if kml_id:
            kml_ids_to_cleanup.append(kml_id)
        
        # Test 5: Invalid coordinates
        self.test_kml_invalid_coordinates()
        
        # Test 6: Invalid XML
        self.test_kml_invalid_xml()
        
        # Test 7: Non-KML file
        self.test_kml_non_kml_file()
        
        # Test 8: UTF-8 with BOM
        kml_id = self.test_kml_encoding_utf8_bom()
        if kml_id:
            kml_ids_to_cleanup.append(kml_id)
        
        # Test 9: Get KML locations
        self.test_get_kml_locations()
        
        # Cleanup: Delete uploaded KML data
        print("\n" + "=" * 80)
        print("🧹 CLEANUP: DELETING TEST KML DATA")
        print("=" * 80)
        
        for kml_id in kml_ids_to_cleanup:
            self.test_delete_kml_data(kml_id)
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 KML PARSER TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = KMLParserTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 ALL KML PARSER TESTS PASSED!")
        sys.exit(0)
    else:
        print("\n💥 SOME KML PARSER TESTS FAILED!")
        sys.exit(1)