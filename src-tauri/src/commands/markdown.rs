use pulldown_cmark::{html, Options, Parser};

#[tauri::command]
pub fn render_markdown(source: String) -> Result<String, String> {
    let mut opts = Options::empty();
    opts.insert(Options::ENABLE_STRIKETHROUGH);
    opts.insert(Options::ENABLE_TABLES);
    opts.insert(Options::ENABLE_TASKLISTS);
    opts.insert(Options::ENABLE_SMART_PUNCTUATION);
    let parser = Parser::new_ext(&source, opts);
    let mut out = String::with_capacity(source.len());
    html::push_html(&mut out, parser);
    Ok(out)
}
