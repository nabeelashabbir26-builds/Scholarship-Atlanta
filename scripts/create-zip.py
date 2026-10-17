import os
import zipfile

def create_project_zip():
    output_path = os.path.join('public', 'scholarship-atlas.zip')
    os.makedirs('public', exist_ok=True)
    
    exclude_dirs = {'node_modules', 'dist', '.git', '.aistudio', '__pycache__'}
    exclude_files = {'scholarship-atlas.zip'}

    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk('.'):
            # Prune excluded directories
            dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith('.')]
            
            for file in files:
                if file in exclude_files or file.endswith('.pyc'):
                    continue
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, '.')
                zipf.write(file_path, rel_path)
                
    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"Created {output_path} successfully ({size_mb:.2f} MB)")

if __name__ == '__main__':
    create_project_zip()
