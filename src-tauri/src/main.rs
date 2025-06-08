
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use std::fs;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn save_file_dialog(content: String, filename: String) -> Result<String, String> {
    use tauri::api::dialog::FileDialogBuilder;
    
    let file_path = FileDialogBuilder::new()
        .set_file_name(&filename)
        .add_filter("PDF files", &["pdf"])
        .add_filter("Excel files", &["xlsx"])
        .add_filter("JSON files", &["json"])
        .add_filter("All files", &["*"])
        .save_file()
        .await;
        
    match file_path {
        Some(path) => {
            match fs::write(&path, content) {
                Ok(_) => Ok(path.to_string_lossy().to_string()),
                Err(e) => Err(format!("Failed to write file: {}", e)),
            }
        }
        None => Err("No file path selected".to_string()),
    }
}

#[tauri::command]
async fn open_file_dialog() -> Result<String, String> {
    use tauri::api::dialog::FileDialogBuilder;
    
    let file_path = FileDialogBuilder::new()
        .add_filter("JSON files", &["json"])
        .add_filter("Excel files", &["xlsx"])
        .add_filter("All files", &["*"])
        .pick_file()
        .await;
        
    match file_path {
        Some(path) => {
            match fs::read_to_string(&path) {
                Ok(content) => Ok(content),
                Err(e) => Err(format!("Failed to read file: {}", e)),
            }
        }
        None => Err("No file selected".to_string()),
    }
}

#[tauri::command]
fn show_notification(app_handle: tauri::AppHandle, title: String, body: String) -> Result<(), String> {
    use tauri::api::notification::Notification;
    
    Notification::new(&app_handle.config().tauri.bundle.identifier)
        .title(&title)
        .body(&body)
        .show()
        .map_err(|e| format!("Failed to show notification: {}", e))
}

#[tauri::command]
fn get_app_version(app_handle: tauri::AppHandle) -> String {
    app_handle.package_info().version.to_string()
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            greet,
            save_file_dialog,
            open_file_dialog,
            show_notification,
            get_app_version
        ])
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
