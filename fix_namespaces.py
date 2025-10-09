import os
import re
from pathlib import Path

def fix_remaining_namespaces():
    """Fix remaining namespace issues in migrated files"""
    
    monolithic_path = r"d:\HOC_TAP\SWP391\SWP391--EV-Station-Based-Rental-System\Monolithic"
    
    # Pattern replacements
    patterns = [
        # Fix using statements
        (r'using EVStation_basedRentalSystem\.Services\.AuthAPI\.Service\.IService;', 'using Monolithic.Services.Auth.IService;'),
        (r'using EVStation_basedRentalSystem\.Services\.AuthAPI\.Services\.IService;', 'using Monolithic.Services.Auth.IService;'),
        (r'using EVStation_basedRentalSystem\.Services\.AuthAPI\.Models\.Dto\.Request;', 'using Monolithic.Models.Auth.Dto.Request;'),
        (r'using EVStation_basedRentalSystem\.Services\.AuthAPI\.Models\.Dto\.Response;', 'using Monolithic.Models.Auth.Dto.Response;'),
        (r'using EVStation_basedRentalSystem\.Services\.AuthAPI\.Models\.Dto;', 'using Monolithic.Models.Auth.Dto;'),
        (r'using EVStation_basedRentalSystem\.Services\.AuthAPI\.Models;', 'using Monolithic.Models.Auth;'),
        (r'using EVStation_basedRentalSystem\.Services\.AuthAPI\.Data;', 'using Monolithic.Data;'),
        (r'using EVStation_basedRentalSystem\.Services\.AuthAPI\.Clients;', 'using Monolithic.Services.Auth;'),
        
        # Fix other service namespaces
        (r'using EVStation_basedRentalSystem\.Services\.UserAPI\.Models;', 'using Monolithic.Models.User;'),
        (r'using EVStation_basedRentalSystem\.Services\.UserAPI\.Data;', 'using Monolithic.Data;'),
        (r'using EVStation_basedRentalSystem\.Services\.UserAPI\.Clients;', 'using Monolithic.Services.User;'),
        
        # Fix Car service namespaces
        (r'using EVStation_basedRentalSystem\.Services\.CarAPI\.DTOs;', 'using Monolithic.DTOs.Car;'),
        (r'using EVStation_basedRentalSystem\.Services\.CarAPI\.Services\.IService;', 'using Monolithic.Services.Car.IService;'),
        (r'using EVStation_basedRentalSystem\.Services\.CarAPI\.Repository\.IRepository;', 'using Monolithic.Repository.Car.IRepository;'),
        (r'using EVStation_basedRentalSystem\.Services\.CarAPI\.Models;', 'using Monolithic.Models.Car;'),
        
        # Fix Booking service namespaces
        (r'using EVStation_basedRentalSystem\.Services\.BookingAPI\.DTOs;', 'using Monolithic.DTOs.Booking;'),
        (r'using EVStation_basedRentalSystem\.Services\.BookingAPI\.Services\.IService;', 'using Monolithic.Services.Booking.IService;'),
        (r'using EVStation_basedRentalSystem\.Services\.BookingAPI\.Repository\.IRepository;', 'using Monolithic.Repository.Booking.IRepository;'),
        (r'using EVStation_basedRentalSystem\.Services\.BookingAPI\.Models;', 'using Monolithic.Models.Booking;'),
        
        # Fix Station service namespaces  
        (r'using EVStation_basedRendtalSystem\.Services\.StationAPI\.DTOs;', 'using Monolithic.DTOs.Station;'),
        (r'using EVStation_basedRendtalSystem\.Services\.StationAPI\.Services\.IService;', 'using Monolithic.Services.Station.IService;'),
        (r'using EVStation_basedRendtalSystem\.Services\.StationAPI\.Repository\.IRepository;', 'using Monolithic.Repository.Station.IRepository;'),
        (r'using EVStation_basedRendtalSystem\.Services\.StationAPI\.Models;', 'using Monolithic.Models.Station;'),
        
        # Fix Feedback service namespaces
        (r'using EVStation_basedRendtalSystem\.Services\.FeedbackAPI\.DTOs;', 'using Monolithic.DTOs.Feedback;'),
        (r'using EVStation_basedRendtalSystem\.Services\.FeedbackAPI\.Services\.IService;', 'using Monolithic.Services.Feedback.IService;'),
        (r'using EVStation_basedRendtalSystem\.Services\.FeedbackAPI\.Repository\.IRepository;', 'using Monolithic.Repository.Feedback.IRepository;'),
        (r'using EVStation_basedRendtalSystem\.Services\.FeedbackAPI\.Models;', 'using Monolithic.Models.Feedback;'),
        
        # Fix Incident service namespaces
        (r'using IncidentAPI\.DTOs\.Request;', 'using Monolithic.DTOs.Incident.Request;'),
        (r'using IncidentAPI\.DTOs\.Response;', 'using Monolithic.DTOs.Incident.Response;'),
        (r'using IncidentAPI\.Services\.IServices;', 'using Monolithic.Services.Incident.IServices;'),
        (r'using IncidentAPI\.Models;', 'using Monolithic.Models.Incident;'),
        
        # Fix generic references
        (r'EVStation_basedRentalSystem\.Services\..*?\.Controllers', 'Monolithic.Controllers'),
        (r'EVStation_basedRentalSystem\.Services\..*?\.Services', 'Monolithic.Services'),
        (r'EVStation_basedRentalSystem\.Services\..*?\.Repository', 'Monolithic.Repository'),
        (r'EVStation_basedRentalSystem\.Services\..*?\.DTOs', 'Monolithic.DTOs'),
        (r'EVStation_basedRentalSystem\.Services\..*?\.Models', 'Monolithic.Models'),
        (r'EVStation_basedRentalSystem\.Services\..*?\.Data', 'Monolithic.Data'),
        
        # Fix duplicate and old references
        (r'using Monolithic\.Models\.Auth\.Dto\.Request;', 'using Monolithic.DTOs.Auth.Request;'),
        (r'using Monolithic\.Models\.Auth\.Dto\.Response;', 'using Monolithic.DTOs.Auth.Response;'),
        (r'using Monolithic\.Models\.Auth\.Dto;', 'using Monolithic.DTOs.Auth;'),
    ]
    
    # Process all .cs files in monolithic
    for root, dirs, files in os.walk(monolithic_path):
        for file in files:
            if file.endswith('.cs'):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    original_content = content
                    
                    # Apply all pattern replacements
                    for pattern, replacement in patterns:
                        content = re.sub(pattern, replacement, content)
                    
                    # Only write if content changed
                    if content != original_content:
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(content)
                        print(f"Fixed namespaces in: {file_path}")
                        
                except Exception as e:
                    print(f"Error processing {file_path}: {e}")

if __name__ == "__main__":
    fix_remaining_namespaces()
    print("Namespace fixes completed!")