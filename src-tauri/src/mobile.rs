
use tauri::{App, Manager};

#[tauri::mobile_entry_point]
fn mobile_entry_point() -> App {
  tauri::Builder::default()
    .setup(|app| {
      Ok(())
    })
    .build(tauri::generate_context!())
    .expect("error while building tauri application")
}
