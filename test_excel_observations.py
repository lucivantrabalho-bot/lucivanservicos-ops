#!/usr/bin/env python3
"""
Focused test for Excel Observations System
Tests the new card system with observations per Excel record
"""

import requests
import json
import sys
from datetime import datetime
import pandas as pd
import io

# Configuration
BASE_URL = "https://pendency-hub.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

class ExcelObservationsTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.admin_token = None
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
    
    def create_test_excel_file(self, category, data):
        """Create a test Excel file with given data"""
        try:
            df = pd.DataFrame(data)
            excel_buffer = io.BytesIO()
            df.to_excel(excel_buffer, index=False, engine='openpyxl')
            excel_buffer.seek(0)
            return excel_buffer.getvalue()
        except Exception as e:
            self.log_test(f"Create Test Excel - {category}", False, f"Failed to create Excel file: {str(e)}")
            return None

    def test_excel_observations_complete_flow(self):
        """Test complete Excel observations flow"""
        print("\n" + "=" * 80)
        print("📊 TESTE COMPLETO DO SISTEMA DE OBSERVAÇÕES EXCEL")
        print("=" * 80)
        
        try:
            # Step 1: Upload Excel CLIMA file with test data
            print("📤 PASSO 1: Upload de arquivo Excel CLIMA")
            clima_data = [
                {"Site": "BRH-001", "Temperatura": "25°C", "Umidade": "60%", "Status": "Normal"},
                {"Site": "CN19-Torre", "Temperatura": "22°C", "Umidade": "55%", "Status": "Alerta"},
                {"Site": "teste", "Temperatura": "20°C", "Umidade": "50%", "Status": "OK"}
            ]
            
            excel_content = self.create_test_excel_file("CLIMA", clima_data)
            if not excel_content:
                return False
            
            # Upload Excel file
            files = {'file': ('test_clima_obs.xlsx', excel_content, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
            
            upload_response = requests.post(
                f"{self.base_url}/admin/upload-excel/CLIMA",
                headers=self.get_auth_headers(),
                files=files,
                timeout=30
            )
            
            if upload_response.status_code != 200:
                self.log_test("Upload CLIMA", False, f"Upload failed: {upload_response.status_code}", upload_response.text)
                return False
            
            self.log_test("Upload CLIMA", True, "Successfully uploaded CLIMA Excel")
            
            # Step 2: Search for site 'teste' to get record with _record_id
            print("\n🔍 PASSO 2: Buscar por site 'teste'")
            search_response = requests.get(
                f"{self.base_url}/excel/search-site",
                headers=self.get_auth_headers(),
                params={"site": "teste"},
                timeout=10
            )
            
            if search_response.status_code != 200:
                self.log_test("Search Site", False, f"Search failed: {search_response.status_code}", search_response.text)
                return False
            
            search_result = search_response.json()
            
            # Verify _record_id field is present
            if "data" not in search_result or "CLIMA" not in search_result["data"]:
                self.log_test("Search Site", False, "No CLIMA data found in search results")
                return False
            
            clima_records = search_result["data"]["CLIMA"]["records"]
            if not clima_records:
                self.log_test("Search Site", False, "No records found for site 'teste'")
                return False
            
            # Check for _record_id field
            test_record = clima_records[0]
            if "_record_id" not in test_record:
                self.log_test("Record ID Field", False, "Missing _record_id field in search results")
                return False
            
            record_id = test_record["_record_id"]
            self.log_test("Record ID Field", True, f"Found record with _record_id: {record_id}")
            
            # Step 3: Add observations
            print("\n📝 PASSO 3: Adicionar observações")
            
            # Add first observation
            observation1_text = "Equipamento precisa de calibração urgente"
            add_obs1_response = requests.post(
                f"{self.base_url}/excel/records/{record_id}/observations",
                headers=self.get_auth_headers(),
                json={"observation": observation1_text},
                timeout=10
            )
            
            if add_obs1_response.status_code != 200:
                self.log_test("Add Observation 1", False, f"Failed: {add_obs1_response.status_code}", add_obs1_response.text)
                return False
            
            obs1_result = add_obs1_response.json()
            observation1_id = obs1_result.get("observation_id")
            self.log_test("Add Observation 1", True, f"Added: '{observation1_text}'")
            
            # Add second observation
            observation2_text = "Verificado em campo - funcionando normal"
            add_obs2_response = requests.post(
                f"{self.base_url}/excel/records/{record_id}/observations",
                headers=self.get_auth_headers(),
                json={"observation": observation2_text},
                timeout=10
            )
            
            if add_obs2_response.status_code != 200:
                self.log_test("Add Observation 2", False, f"Failed: {add_obs2_response.status_code}", add_obs2_response.text)
                return False
            
            obs2_result = add_obs2_response.json()
            observation2_id = obs2_result.get("observation_id")
            self.log_test("Add Observation 2", True, f"Added: '{observation2_text}'")
            
            # Step 4: List observations
            print("\n📋 PASSO 4: Listar observações")
            list_obs_response = requests.get(
                f"{self.base_url}/excel/records/{record_id}/observations",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            if list_obs_response.status_code != 200:
                self.log_test("List Observations", False, f"Failed: {list_obs_response.status_code}", list_obs_response.text)
                return False
            
            observations = list_obs_response.json()
            
            # Verify both observations are present
            obs_texts = [obs.get("observation") for obs in observations]
            if observation1_text in obs_texts and observation2_text in obs_texts:
                self.log_test("List Observations", True, f"Listed {len(observations)} observations successfully")
            else:
                self.log_test("List Observations", False, f"Not all observations found. Expected 2, found: {obs_texts}")
                return False
            
            # Step 5: Delete one observation
            print("\n🗑️ PASSO 5: Excluir observação")
            delete_obs_response = requests.delete(
                f"{self.base_url}/excel/observations/{observation1_id}",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            if delete_obs_response.status_code != 200:
                self.log_test("Delete Observation", False, f"Failed: {delete_obs_response.status_code}", delete_obs_response.text)
                return False
            
            self.log_test("Delete Observation", True, "Successfully deleted observation")
            
            # Step 6: Verify deletion
            print("\n✅ PASSO 6: Verificar exclusão")
            verify_list_response = requests.get(
                f"{self.base_url}/excel/records/{record_id}/observations",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            if verify_list_response.status_code == 200:
                remaining_observations = verify_list_response.json()
                remaining_texts = [obs.get("observation") for obs in remaining_observations]
                
                if observation1_text not in remaining_texts and observation2_text in remaining_texts:
                    self.log_test("Verify Deletion", True, f"Deletion verified - {len(remaining_observations)} observations remaining")
                else:
                    self.log_test("Verify Deletion", False, f"Deletion not verified. Remaining: {remaining_texts}")
            
            print("\n" + "=" * 80)
            print("✅ TESTE COMPLETO DO SISTEMA DE OBSERVAÇÕES EXCEL FINALIZADO")
            print("=" * 80)
            
            return True
            
        except Exception as e:
            self.log_test("Excel Observations Complete Flow", False, f"Test failed: {str(e)}")
            return False

    def run_tests(self):
        """Run Excel observations tests"""
        print("=" * 80)
        print("TESTE DO SISTEMA DE OBSERVAÇÕES EXCEL")
        print("=" * 80)
        print(f"Testing against: {self.base_url}")
        print()
        
        # Step 1: Login as admin
        if not self.login_admin():
            print("❌ Cannot proceed without admin authentication")
            return False
        
        print()
        
        # Run the complete flow test
        success = self.test_excel_observations_complete_flow()
        
        print("\n" + "=" * 80)
        print("RESUMO DOS TESTES")
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
    tester = ExcelObservationsTester()
    success = tester.run_tests()
    sys.exit(0 if success else 1)