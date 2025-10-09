import os
import shutil
import re
from pathlib import Path

def copy_and_modify_files():
    """Copy all source files from microservices to monolithic structure"""
    
    # Base paths
    base_path = r"d:\HOC_TAP\SWP391\SWP391--EV-Station-Based-Rental-System"
    monolithic_path = os.path.join(base_path, "Monolithic")
    
    # Service mappings
    services = {
        "EVStation-basedRentalSystem.Services.CouponAPI": "Auth",
        "EVStation-basedRentalSystem.Services.UserAPI": "User", 
        "EVStation-basedRentalSysteEM.Services.CarAPI": "Car",
        "EVStation-basedRentalSysteEM.Services.BookingAPI": "Booking",
        "EVStation-basedRendtalSystem.Services.StationAPI": "Station",
        "EVStation-basedRendtalSystem.Services.PaymentAPI": "Payment",
        "EVStation-basedRendtalSystem.Services.FeedbackAPI": "Feedback",
        "EVStation-basedRendtalSystem.Services.ContractAPI": "Contract",
        "EVStation-basedRentalSystem.IncidentAPI": "Incident",
        "EVStation-basedRentalSystem.Service.AdminAPI": "Admin",
        "EVStation-basedRentalSystem.Services.MailAPI": "Mail",
        "EVStation-basedRentalSystem.Services.IncidentAPI": "Incident2"
    }
    
    for service_folder, service_name in services.items():
        service_path = os.path.join(base_path, service_folder)
        
        if not os.path.exists(service_path):
            print(f"Service path not found: {service_path}")
            continue
            
        print(f"Processing {service_name} from {service_folder}")
        
        # Copy Controllers
        controllers_src = os.path.join(service_path, "Controllers")
        if os.path.exists(controllers_src):
            controllers_dest = os.path.join(monolithic_path, "Controllers", service_name)
            copy_files_with_namespace_fix(controllers_src, controllers_dest, service_name, "Controllers")
        
        # Copy Services
        services_src = os.path.join(service_path, "Services")
        if os.path.exists(services_src):
            services_dest = os.path.join(monolithic_path, "Services", service_name)
            copy_files_with_namespace_fix(services_src, services_dest, service_name, "Services")
        
        # Copy Repository
        repo_src = os.path.join(service_path, "Repository")
        if os.path.exists(repo_src):
            repo_dest = os.path.join(monolithic_path, "Repository", service_name)
            copy_files_with_namespace_fix(repo_src, repo_dest, service_name, "Repository")
        
        # Copy DTOs
        dtos_src = os.path.join(service_path, "DTOs")
        if os.path.exists(dtos_src):
            dtos_dest = os.path.join(monolithic_path, "DTOs", service_name)
            copy_files_with_namespace_fix(dtos_src, dtos_dest, service_name, "DTOs")
        
        # Copy Models
        models_src = os.path.join(service_path, "Models")
        if os.path.exists(models_src):
            models_dest = os.path.join(monolithic_path, "Models", service_name)
            copy_files_with_namespace_fix(models_src, models_dest, service_name, "Models")
        
        # Copy Data folder (DbContext)
        data_src = os.path.join(service_path, "Data")
        if os.path.exists(data_src):
            data_dest = os.path.join(monolithic_path, "Data")
            copy_files_with_namespace_fix(data_src, data_dest, service_name, "Data")

def copy_files_with_namespace_fix(src, dest, service_name, folder_type):
    """Copy files and fix namespaces"""
    if not os.path.exists(src):
        return
    
    os.makedirs(dest, exist_ok=True)
    
    for root, dirs, files in os.walk(src):
        for file in files:
            if file.endswith(('.cs', '.json')) and not file.endswith('.user'):
                src_file = os.path.join(root, file)
                
                # Calculate relative path for subdirectories
                rel_path = os.path.relpath(root, src)
                if rel_path == ".":
                    dest_file = os.path.join(dest, file)
                else:
                    dest_dir = os.path.join(dest, rel_path)
                    os.makedirs(dest_dir, exist_ok=True)
                    dest_file = os.path.join(dest_dir, file)
                
                try:
                    if file.endswith('.cs'):
                        # Read, modify namespaces, and write
                        with open(src_file, 'r', encoding='utf-8') as f:
                            content = f.read()
                        
                        # Fix namespaces
                        content = fix_namespaces(content, service_name, folder_type)
                        
                        with open(dest_file, 'w', encoding='utf-8') as f:
                            f.write(content)
                    else:
                        # Just copy non-C# files
                        shutil.copy2(src_file, dest_file)
                        
                    print(f"Copied: {file} -> {dest_file}")
                except Exception as e:
                    print(f"Error copying {src_file}: {e}")

def fix_namespaces(content, service_name, folder_type):
    """Fix namespaces to match monolithic structure"""
    
    # Replace old namespaces with new ones
    namespace_patterns = [
        (r'EVStation_basedRentalSystem\.Services\..*?\.Controllers', f'Monolithic.Controllers.{service_name}'),
        (r'EVStation_basedRentalSystem\.Services\..*?\.Services', f'Monolithic.Services.{service_name}'),
        (r'EVStation_basedRentalSystem\.Services\..*?\.Repository', f'Monolithic.Repository.{service_name}'),
        (r'EVStation_basedRentalSystem\.Services\..*?\.DTOs', f'Monolithic.DTOs.{service_name}'),
        (r'EVStation_basedRentalSystem\.Services\..*?\.Models', f'Monolithic.Models.{service_name}'),
        (r'EVStation_basedRentalSystem\.Services\..*?\.Data', f'Monolithic.Data'),
        (r'EVStation_basedRendtalSystem\.Services\..*?\.Controllers', f'Monolithic.Controllers.{service_name}'),
        (r'EVStation_basedRendtalSystem\.Services\..*?\.Services', f'Monolithic.Services.{service_name}'),
        (r'EVStation_basedRendtalSystem\.Services\..*?\.Repository', f'Monolithic.Repository.{service_name}'),
        (r'EVStation_basedRendtalSystem\.Services\..*?\.DTOs', f'Monolithic.DTOs.{service_name}'),
        (r'EVStation_basedRendtalSystem\.Services\..*?\.Models', f'Monolithic.Models.{service_name}'),
        (r'EVStation_basedRendtalSystem\.Services\..*?\.Data', f'Monolithic.Data'),
        (r'EVStation_basedRentalSysteEM\.Services\..*?\.Controllers', f'Monolithic.Controllers.{service_name}'),
        (r'EVStation_basedRentalSysteEM\.Services\..*?\.Services', f'Monolithic.Services.{service_name}'),
        (r'EVStation_basedRentalSysteEM\.Services\..*?\.Repository', f'Monolithic.Repository.{service_name}'),
        (r'EVStation_basedRentalSysteEM\.Services\..*?\.DTOs', f'Monolithic.DTOs.{service_name}'),
        (r'EVStation_basedRentalSysteEM\.Services\..*?\.Models', f'Monolithic.Models.{service_name}'),
        (r'EVStation_basedRentalSysteEM\.Services\..*?\.Data', f'Monolithic.Data'),
        (r'IncidentAPI\..*?\.Controllers', f'Monolithic.Controllers.{service_name}'),
        (r'IncidentAPI\..*?\.Services', f'Monolithic.Services.{service_name}'),
        (r'IncidentAPI\..*?\.Repository', f'Monolithic.Repository.{service_name}'),
        (r'IncidentAPI\..*?\.DTOs', f'Monolithic.DTOs.{service_name}'),
        (r'IncidentAPI\..*?\.Models', f'Monolithic.Models.{service_name}'),
        (r'IncidentAPI\..*?\.Data', f'Monolithic.Data'),
    ]
    
    for pattern, replacement in namespace_patterns:
        content = re.sub(pattern, replacement, content)
    
    # Fix using statements
    using_patterns = [
        (r'using EVStation_basedRentalSystem\.Services\..*?\.Controllers;', f'using Monolithic.Controllers.{service_name};'),
        (r'using EVStation_basedRentalSystem\.Services\..*?\.Services;', f'using Monolithic.Services.{service_name};'),
        (r'using EVStation_basedRentalSystem\.Services\..*?\.Repository;', f'using Monolithic.Repository.{service_name};'),
        (r'using EVStation_basedRentalSystem\.Services\..*?\.DTOs;', f'using Monolithic.DTOs.{service_name};'),
        (r'using EVStation_basedRentalSystem\.Services\..*?\.Models;', f'using Monolithic.Models.{service_name};'),
        (r'using EVStation_basedRentalSystem\.Services\..*?\.Data;', f'using Monolithic.Data;'),
        (r'using EVStation_basedRendtalSystem\.Services\..*?\.Controllers;', f'using Monolithic.Controllers.{service_name};'),
        (r'using EVStation_basedRendtalSystem\.Services\..*?\.Services;', f'using Monolithic.Services.{service_name};'),
        (r'using EVStation_basedRendtalSystem\.Services\..*?\.Repository;', f'using Monolithic.Repository.{service_name};'),
        (r'using EVStation_basedRendtalSystem\.Services\..*?\.DTOs;', f'using Monolithic.DTOs.{service_name};'),
        (r'using EVStation_basedRendtalSystem\.Services\..*?\.Models;', f'using Monolithic.Models.{service_name};'),
        (r'using EVStation_basedRendtalSystem\.Services\..*?\.Data;', f'using Monolithic.Data;'),
        (r'using EVStation_basedRentalSysteEM\.Services\..*?\.Controllers;', f'using Monolithic.Controllers.{service_name};'),
        (r'using EVStation_basedRentalSysteEM\.Services\..*?\.Services;', f'using Monolithic.Services.{service_name};'),
        (r'using EVStation_basedRentalSysteEM\.Services\..*?\.Repository;', f'using Monolithic.Repository.{service_name};'),
        (r'using EVStation_basedRentalSysteEM\.Services\..*?\.DTOs;', f'using Monolithic.DTOs.{service_name};'),
        (r'using EVStation_basedRentalSysteEM\.Services\..*?\.Models;', f'using Monolithic.Models.{service_name};'),
        (r'using EVStation_basedRentalSysteEM\.Services\..*?\.Data;', f'using Monolithic.Data;'),
        (r'using IncidentAPI\..*?\.Controllers;', f'using Monolithic.Controllers.{service_name};'),
        (r'using IncidentAPI\..*?\.Services;', f'using Monolithic.Services.{service_name};'),
        (r'using IncidentAPI\..*?\.Repository;', f'using Monolithic.Repository.{service_name};'),
        (r'using IncidentAPI\..*?\.DTOs;', f'using Monolithic.DTOs.{service_name};'),
        (r'using IncidentAPI\..*?\.Models;', f'using Monolithic.Models.{service_name};'),
        (r'using IncidentAPI\..*?\.Data;', f'using Monolithic.Data;'),
    ]
    
    for pattern, replacement in using_patterns:
        content = re.sub(pattern, replacement, content)
    
    return content

if __name__ == "__main__":
    copy_and_modify_files()
    print("Migration completed!")