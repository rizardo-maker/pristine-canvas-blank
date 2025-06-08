
use tauri::{App, Manager};

#[cfg(target_os = "android")]
fn init_android() {
    android_logger::init_once(
        android_logger::Config::default()
            .with_min_level(log::Level::Debug)
            .with_tag("CollectifyManager"),
    );
}

#[tauri::mobile_entry_point]
fn mobile_entry_point() -> App {
    #[cfg(target_os = "android")]
    init_android();

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            crate::greet,
            crate::save_file_dialog,
            crate::open_file_dialog,
            crate::show_notification,
            crate::get_app_version
        ])
        .setup(|app| {
            #[cfg(target_os = "android")]
            {
                // Android-specific setup
                log::info!("Collectify Manager starting on Android");
            }
            
            #[cfg(target_os = "ios")]
            {
                // iOS-specific setup (for future use)
                log::info!("Collectify Manager starting on iOS");
            }

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
}
