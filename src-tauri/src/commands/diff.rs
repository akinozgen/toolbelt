use similar::TextDiff;

#[tauri::command]
pub fn diff_unified_patch(
    left: String,
    right: String,
    context: u32,
    name_a: Option<String>,
    name_b: Option<String>,
) -> Result<String, String> {
    let diff = TextDiff::from_lines(&left, &right);
    let name_a = name_a.unwrap_or_else(|| "original.txt".into());
    let name_b = name_b.unwrap_or_else(|| "modified.txt".into());
    let patch = diff
        .unified_diff()
        .context_radius(context as usize)
        .header(&name_a, &name_b)
        .to_string();
    Ok(patch)
}
