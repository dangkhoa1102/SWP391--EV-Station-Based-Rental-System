import os
import re
from pathlib import Path

# Base paths
monolithic_path = Path(r"D:\HOC_TAP\SWP391\SWP391--EV-Station-Based-Rental-System\Monolithic")

def fix_model_namespaces():
    """Fix namespace conflicts by using specific namespace for models"""
    
    # Service folders that have model conflicts
    model_folders = ['Car', 'Booking', 'Station', 'Feedback', 'User', 'Incident']
    
    for folder in model_folders:
        folder_path = monolithic_path / "Models" / folder
        if folder_path.exists():
            for cs_file in folder_path.rglob("*.cs"):
                with open(cs_file, "r", encoding="utf-8") as f:
                    content = f.read()
                
                # Change namespace from Monolithic.Models to Monolithic.Models.{FolderName}
                content = re.sub(
                    r'namespace\s+Monolithic\.Models\s*{',
                    f'namespace Monolithic.Models.{folder}\n{{',
                    content
                )
                
                with open(cs_file, "w", encoding="utf-8") as f:
                    f.write(content)
                    
                print(f"Fixed namespace in: {cs_file}")

def add_using_statements():
    """Add using statements to files that need the model classes"""
    
    # Files that need using statements
    files_to_update = [
        monolithic_path / "Data" / "MonolithicDbContext.cs",
        monolithic_path / "Data" / "FeedbackDbContext.cs", 
        monolithic_path / "Data" / "UserDbContext.cs",
        monolithic_path / "Data" / "StationDbContext.cs"
    ]
    
    for file_path in files_to_update:
        if file_path.exists():
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            # Add using statements at the top
            using_statements = """using Monolithic.Models.Car;
using Monolithic.Models.Booking;
using Monolithic.Models.Station;
using Monolithic.Models.Feedback;
using Monolithic.Models.User;
using Monolithic.Models.Incident;
"""
            
            # Check if using statements already exist
            if "using Monolithic.Models.Car;" not in content:
                # Insert after existing using statements
                lines = content.split('\n')
                insert_idx = 0
                for i, line in enumerate(lines):
                    if line.strip().startswith('using '):
                        insert_idx = i + 1
                    elif line.strip() == '' and insert_idx > 0:
                        break
                
                lines.insert(insert_idx, using_statements)
                content = '\n'.join(lines)
                
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(content)
                    
                print(f"Added using statements to: {file_path}")

if __name__ == "__main__":
    print("Fixing model namespace conflicts...")
    fix_model_namespaces()
    add_using_statements()
    print("Model namespace fix completed!")