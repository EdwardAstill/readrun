use std::process::ExitCode;

use tauri::{WebviewUrl, WebviewWindowBuilder};
use url::{Host, Url};

fn viewer_url(raw: Option<&str>) -> Result<Url, String> {
    let raw = raw.ok_or_else(|| "Desktop viewer URL is required.".to_string())?;
    let url =
        Url::parse(raw).map_err(|error| format!("Invalid desktop viewer URL: {error}"))?;

    if url.scheme() != "http" {
        return Err("Desktop viewer URL must use http.".to_string());
    }

    let is_loopback = match url.host() {
        Some(Host::Domain(host)) => host.eq_ignore_ascii_case("localhost"),
        Some(Host::Ipv4(address)) => address.is_loopback(),
        Some(Host::Ipv6(address)) => address.is_loopback(),
        None => false,
    };

    if !is_loopback {
        return Err("Desktop viewer URL must use a loopback host.".to_string());
    }

    Ok(url)
}

fn main() -> ExitCode {
    let url = match viewer_url(std::env::args().nth(1).as_deref()) {
        Ok(url) => url,
        Err(message) => {
            eprintln!("{message}");
            return ExitCode::from(2);
        }
    };

    let result = tauri::Builder::default()
        .setup(move |app| {
            WebviewWindowBuilder::new(app, "main", WebviewUrl::External(url.clone()))
                .title("readrun")
                .inner_size(1280.0, 800.0)
                .min_inner_size(640.0, 480.0)
                .resizable(true)
                .build()?;
            Ok(())
        })
        .run(tauri::generate_context!());

    match result {
        Ok(()) => ExitCode::SUCCESS,
        Err(error) => {
            eprintln!("Could not run readrun desktop: {error}");
            ExitCode::FAILURE
        }
    }
}

#[cfg(test)]
mod tests {
    use super::viewer_url;

    #[test]
    fn accepts_supported_loopback_urls() {
        for raw in [
            "http://localhost:3001/docs",
            "http://127.42.0.1:3001/",
            "http://[::1]:3001/",
        ] {
            assert_eq!(viewer_url(Some(raw)).unwrap().as_str(), raw);
        }
    }

    #[test]
    fn rejects_missing_or_malformed_urls() {
        assert_eq!(
            viewer_url(None).unwrap_err(),
            "Desktop viewer URL is required."
        );
        assert!(viewer_url(Some("not a url"))
            .unwrap_err()
            .starts_with("Invalid desktop viewer URL:"));
    }

    #[test]
    fn rejects_non_http_and_non_loopback_urls() {
        assert_eq!(
            viewer_url(Some("https://localhost:3001/")).unwrap_err(),
            "Desktop viewer URL must use http."
        );
        assert_eq!(
            viewer_url(Some("http://example.com:3001/")).unwrap_err(),
            "Desktop viewer URL must use a loopback host."
        );
        assert_eq!(
            viewer_url(Some("http://0.0.0.0:3001/")).unwrap_err(),
            "Desktop viewer URL must use a loopback host."
        );
    }
}
