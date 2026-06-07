import os
import glob

def fix_grey50_backgrounds():
    search_dir = r"C:\Users\USER\OneDrive\Desktop\Sistems-ERP\frontend\src\features"
    tsx_files = glob.glob(os.path.join(search_dir, "**", "*.tsx"), recursive=True)
    
    for filepath in tsx_files:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
            
        if "bgcolor: 'grey.50'" in content:
            # Replace the string to use the theme mode aware function
            new_content = content.replace(
                "bgcolor: 'grey.50'", 
                "bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'grey.50'"
            )
            
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Fixed {os.path.basename(filepath)}")

if __name__ == "__main__":
    fix_grey50_backgrounds()
