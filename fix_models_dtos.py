import os
import shutil
import re
from pathlib import Path

# Base paths
base_path = Path(r"D:\HOC_TAP\SWP391\SWP391--EV-Station-Based-Rental-System")
monolithic_path = base_path / "Monolithic"

# Service mapping
service_mappings = {
    "EVStation-basedRentalSystem.Services.UserAPI": "User",
    "EVStation-basedRentalSystem.Services.AuthAPI": "Auth", 
    "EVSation.Services.BookingAPI": "Booking",
    "EVStation-basedRentalSysteEM.Services.BookingAPI": "Booking",
    "EVStation-basedRendtalSystem.Services.CarAPI": "Car",
    "EVStation-basedRentalSysteEM.Services.CarAPI": "Car", 
    "EVStation-basedRendtalSystem.Services.StationAPI": "Station",
    "EVStation-basedRendtalSystem.Services.PaymentAPI": "Payment",
    "EVStation-basedRendtalSystem.Services.FeedbackAPI": "Feedback",
    "EVStation-basedRendtalSystem.Services.ContractAPI": "Contract",
    "EVStation-basedRentalSystem.Services.IncidentAPI": "Incident",
    "EVStation-basedRentalSystem.IncidentAPI": "Incident2",
    "EVStation-basedRentalSystem.Service.AdminAPI": "Admin",
    "EVStation-basedRentalSystem.Services.MailAPI": "Mail",
    "UserAPI": "User"
}

# Bước 1: Xóa và tạo lại thư mục DTOs và Models
def clean_and_create_folders():
    print("Cleaning and creating folders...")
    
    # Xóa thư mục DTOs và Models
    dtos_path = monolithic_path / "DTOs"
    models_path = monolithic_path / "Models"
    
    if dtos_path.exists():
        shutil.rmtree(dtos_path)
    if models_path.exists():
        shutil.rmtree(models_path)
    
    # Tạo lại
    dtos_path.mkdir(exist_ok=True)
    models_path.mkdir(exist_ok=True)
    
    # Tạo thư mục con cho DTOs
    for service_name in service_mappings.values():
        (dtos_path / service_name).mkdir(exist_ok=True)
        (dtos_path / service_name / "Request").mkdir(exist_ok=True)
        (dtos_path / service_name / "Response").mkdir(exist_ok=True)
        (models_path / service_name).mkdir(exist_ok=True)

# Bước 2: Copy DTOs từ các service
def copy_dtos():
    print("Copying DTOs...")
    
    for service_folder, target_name in service_mappings.items():
        service_path = base_path / service_folder
        if service_path.exists():
            # Copy DTOs
            dtos_source = service_path / "DTOs"
            if dtos_source.exists():
                for dto_file in dtos_source.rglob("*.cs"):
                    # Tìm thư mục đích
                    relative_path = dto_file.relative_to(dtos_source)
                    target_file = monolithic_path / "DTOs" / target_name / relative_path
                    
                    # Tạo thư mục nếu cần
                    target_file.parent.mkdir(parents=True, exist_ok=True)
                    
                    # Copy file
                    shutil.copy2(dto_file, target_file)
                    print(f"Copied DTO: {dto_file} -> {target_file}")

# Bước 3: Copy Models từ các service
def copy_models():
    print("Copying Models...")
    
    for service_folder, target_name in service_mappings.items():
        service_path = base_path / service_folder
        if service_path.exists():
            # Copy Model/Models
            for model_folder in ["Model", "Models"]:
                models_source = service_path / model_folder
                if models_source.exists():
                    for model_file in models_source.rglob("*.cs"):
                        # Tìm thư mục đích
                        relative_path = model_file.relative_to(models_source)
                        target_file = monolithic_path / "Models" / target_name / relative_path
                        
                        # Tạo thư mục nếu cần
                        target_file.parent.mkdir(parents=True, exist_ok=True)
                        
                        # Copy file
                        shutil.copy2(model_file, target_file)
                        print(f"Copied Model: {model_file} -> {target_file}")

# Bước 4: Tạo thêm ApplicationUser và JwtOptions
def create_common_models():
    print("Creating common models...")
    
    # ApplicationUser.cs
    app_user_content = '''using Microsoft.AspNetCore.Identity;

namespace Monolithic.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
    }
}'''
    
    # JwtOptions.cs
    jwt_options_content = '''namespace Monolithic.Models
{
    public class JwtOptions
    {
        public string Issuer { get; set; } = "";
        public string Audience { get; set; } = "";
        public string Secret { get; set; } = "";
    }
}'''

    # Token.cs
    token_content = '''namespace Monolithic.Models
{
    public class Token
    {
        public string AccessToken { get; set; } = "";
        public string RefreshToken { get; set; } = "";
    }
}'''

    with open(monolithic_path / "Models" / "ApplicationUser.cs", "w", encoding="utf-8") as f:
        f.write(app_user_content)
        
    with open(monolithic_path / "Models" / "JwtOptions.cs", "w", encoding="utf-8") as f:
        f.write(jwt_options_content)
        
    with open(monolithic_path / "Models" / "Token.cs", "w", encoding="utf-8") as f:
        f.write(token_content)

# Bước 5: Fix namespace trong các file đã copy
def fix_namespaces():
    print("Fixing namespaces...")
    
    # Fix DTOs namespaces
    for dto_file in (monolithic_path / "DTOs").rglob("*.cs"):
        with open(dto_file, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Thay thế namespace
        content = re.sub(r'namespace\s+EVStation[^{]+', 'namespace Monolithic.DTOs', content)
        content = re.sub(r'using\s+EVStation[^;]+;', '', content)
        content = re.sub(r'using\s+[^.]+\.Services\.[^;]+;', '', content)
        
        with open(dto_file, "w", encoding="utf-8") as f:
            f.write(content)
    
    # Fix Models namespaces
    for model_file in (monolithic_path / "Models").rglob("*.cs"):
        if model_file.name in ["ApplicationUser.cs", "JwtOptions.cs", "Token.cs"]:
            continue
            
        with open(model_file, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Thay thế namespace
        content = re.sub(r'namespace\s+EVStation[^{]+', 'namespace Monolithic.Models', content)
        content = re.sub(r'using\s+EVStation[^;]+;', '', content)
        content = re.sub(r'using\s+[^.]+\.Services\.[^;]+;', '', content)
        
        with open(model_file, "w", encoding="utf-8") as f:
            f.write(content)

if __name__ == "__main__":
    print("Starting DTOs and Models fix...")
    
    clean_and_create_folders()
    copy_dtos()
    copy_models()
    create_common_models()
    fix_namespaces()
    
    print("DTOs and Models fix completed!")