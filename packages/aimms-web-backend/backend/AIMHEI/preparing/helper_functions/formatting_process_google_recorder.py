import re


def format(content: str):
    # Adjusted pattern to capture dialogue entries without a trailing newline
    pattern = r"\[([A-Za-z]+)\]\n(.*?)(?=\n\[|\Z)"
    matches = re.findall(pattern, content, re.DOTALL)

    formatted_lines = []  # Initialize an empty list for formatted lines
    line_number = 1
    for speaker, dialogue in matches:
        dialogue_lines = dialogue.strip().split("\n")
        for line in dialogue_lines:
            if line.strip():  # Skip blank lines
                formatted_line = f"{line_number}: {speaker[0].upper()}: {line.strip()}"
                formatted_lines.append(
                    formatted_line
                )  # Append formatted line to the list
                line_number += 1

    return formatted_lines
