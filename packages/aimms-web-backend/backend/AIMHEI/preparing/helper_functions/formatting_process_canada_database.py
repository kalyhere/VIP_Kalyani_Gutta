def format(content: str):
    lines = content.split("\n")
    # Remove blank or empty lines
    lines = [line.strip() for line in lines if line.strip()]

    formatted_lines = []
    for index, line in enumerate(lines, 1):
        formatted_line = f"{index}: {line}"
        formatted_lines.append(formatted_line)

    return formatted_lines
