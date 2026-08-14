use serde::Serialize;
use serde_json::Value;

fn err(msg: impl ToString) -> String {
    msg.to_string()
}

#[tauri::command]
pub fn format_json(input: String, indent: u8) -> Result<String, String> {
    if input.trim().is_empty() {
        return Ok(String::new());
    }
    let value: Value = serde_json::from_str(&input).map_err(err)?;
    let mut buf = Vec::with_capacity(input.len());
    let indent_bytes = vec![b' '; indent.max(1) as usize];
    let formatter = serde_json::ser::PrettyFormatter::with_indent(&indent_bytes);
    let mut ser = serde_json::Serializer::with_formatter(&mut buf, formatter);
    value.serialize(&mut ser).map_err(err)?;
    String::from_utf8(buf).map_err(err)
}

#[tauri::command]
pub fn format_yaml(input: String, _indent: u8) -> Result<String, String> {
    if input.trim().is_empty() {
        return Ok(String::new());
    }
    let value: serde_yml::Value = serde_yml::from_str(&input).map_err(err)?;
    serde_yml::to_string(&value).map_err(err)
}

#[tauri::command]
pub fn format_xml(input: String, indent: u8) -> Result<String, String> {
    if input.trim().is_empty() {
        return Ok(String::new());
    }
    use quick_xml::events::Event;
    use quick_xml::reader::Reader;
    use quick_xml::writer::Writer;

    let mut reader = Reader::from_str(&input);
    reader.config_mut().trim_text(true);
    let indent_size = indent.max(1) as usize;
    let mut writer = Writer::new_with_indent(Vec::new(), b' ', indent_size);
    let mut buf = Vec::new();
    loop {
        match reader.read_event_into(&mut buf) {
            Ok(Event::Eof) => break,
            Ok(e) => writer.write_event(e).map_err(err)?,
            Err(e) => return Err(format!("Parse error at {}: {e}", reader.error_position())),
        }
        buf.clear();
    }
    String::from_utf8(writer.into_inner()).map_err(err)
}
