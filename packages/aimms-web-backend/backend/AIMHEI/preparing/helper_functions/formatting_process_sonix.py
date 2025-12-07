import re


def format(content: str):
    # Regex pattern to identify speakers and their dialogue
    pattern = r"(Patient|Doctor): (.*)"
    matches = re.findall(pattern, content)

    formatted_lines = []
    line_number = 1
    for speaker, dialogue in matches:
        dialogue_lines = dialogue.strip().split("\n")
        for line in dialogue_lines:
            if line.strip():  # Ignore blank lines
                formatted_line = f"{line_number}: {speaker[0].upper()}: {line.strip()}"
                formatted_lines.append(formatted_line)
                line_number += 1

    return formatted_lines
