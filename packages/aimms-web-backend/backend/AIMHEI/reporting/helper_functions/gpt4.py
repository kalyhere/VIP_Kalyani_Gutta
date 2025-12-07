import aiohttp
import json
import os
import ssl
import certifi
from .gpt4_prompts import prompts as gpt4_prompts


def clean_up(json_data: str):
    # Parse the embedded JSON string
    try:
        data = json.loads(json_data)
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        print(f"Problematic JSON string: {json_data[:100]}")
        return {"error": "JSON parsing failed", "details": str(e)}

    # Clean up each string field
    transformed_output = {}
    for key, value in data.items():
        if isinstance(value, str):
            # Remove newlines and strip excess whitespace
            transformed_output[key] = " ".join(value.split())
        else:
            # Keep other data types as is
            transformed_output[key] = value

    return transformed_output


async def generate_response_async(
    template_type: str = "yes_no", verbose: bool = False, **kwargs
):
    """
    YOU MUST DEFINE THE KEYWORD ARGUMENTS
    EXAMPLE: response = generate_response('write_up', transcript="transcript", other vars here depending on prompt)
    """
    template_info = gpt4_prompts[template_type]

    # Ensure all required parameters are provided
    for param in template_info["parameters"]:
        if param not in kwargs:
            raise ValueError(f"Missing required parameter: {param}")

    # Format the template content with the provided parameters
    formatted_content = template_info["content"].format(**kwargs)
    messages = [{"role": "user", "content": formatted_content}]

    api_url = "https://api.openai.com/v1/chat/completions"
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise EnvironmentError("Missing OPENAI_API_KEY environment variable")

    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

    data = {
        "model": "gpt-4o",
        "response_format": {"type": "json_object"},
        "messages": messages,
        "temperature": 0.0,
        "seed": 42,
    }

    # Create SSL context with certifi certificates
    ssl_context = ssl.create_default_context()
    ssl_context.load_verify_locations(cafile=certifi.where())

    conn = aiohttp.TCPConnector(ssl=ssl_context)
    async with aiohttp.ClientSession(connector=conn) as session:
        async with session.post(api_url, headers=headers, json=data) as response:
            if response.status == 200:
                response_data = await response.json()

                verbose and print(response_data)
                try:
                    cleaned_response = clean_up(
                        response_data["choices"][0]["message"]["content"].strip()
                    )
                except Exception as e:
                    print("Error cleaning response:", e)
                    cleaned_response = {}
                return cleaned_response
            else:
                print("BAD response")
                raise Exception(f"Request failed with status {response.status}")
