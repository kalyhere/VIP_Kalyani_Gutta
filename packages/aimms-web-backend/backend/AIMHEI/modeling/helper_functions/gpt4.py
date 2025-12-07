import aiohttp
import json
from .gpt4_prompts import prompts as gpt4_prompts
import os
import ssl
import certifi
from typing import Dict, Any, List

# Default to gpt-4o for testing, can be overridden by environment variable
DEFAULT_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o")

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
    template_type: str = "yes_no", verbose: bool = True, **kwargs
):
    """
    YOU MUST DEFINE THE KEYWORD ARGUMENTS
    EXAMPLE: response = generate_response('yes_no', context="Context Here", criteria="Criteria Here")
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

    # Use environment variable to override model if set, otherwise use default
    model = os.getenv("OPENAI_MODEL", DEFAULT_MODEL)

    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

    data = {
        "model": model,
        "messages": messages,
        "temperature": 0.0,
        "max_tokens": 4000,  # Increase max tokens to prevent truncation
        "seed": 42,
        "response_format": {"type": "json_object"}  # Ensure JSON output for all responses
    }

    # Create SSL context with certifi certificates
    ssl_context = ssl.create_default_context()
    ssl_context.load_verify_locations(cafile=certifi.where())

    conn = aiohttp.TCPConnector(ssl=ssl_context)
    async with aiohttp.ClientSession(connector=conn) as session:
        try:
            async with session.post(api_url, headers=headers, json=data) as response:
                if response.status == 200:
                    response_data = await response.json()
                    if verbose:
                        print(response_data)
                    try:
                        content = response_data["choices"][0]["message"]["content"].strip()
                        # Ensure we have valid JSON by trying to parse it first
                        try:
                            json.loads(content)
                        except json.JSONDecodeError as e:
                            print(f"Invalid JSON from model: {content[:500]}...")
                            # Return a simple valid JSON response
                            # return {"answer": "no", "explanation": "Failed to parse model response"} 
                            # Raise an exception instead of returning default data
                            raise ValueError(f"Model returned invalid JSON: {content[:100]}...") from e
                            
                        cleaned_response = clean_up(content)
                        # Convert any string numbers to float for scoring
                        for key, value in cleaned_response.items():
                            if isinstance(value, str) and value.replace('.', '').isdigit():
                                cleaned_response[key] = float(value)
                        return cleaned_response
                    except Exception as e:
                        print("Error cleaning response:", e)
                        return {"answer": "no", "explanation": str(e)}
                else:
                    error_text = await response.text()
                    print(f"BAD response {response.status}: {error_text}")
                    raise Exception(f"Request failed with status {response.status}: {error_text}")
        except Exception as e:
            print(f"Error making OpenAI request: {str(e)}")
            raise
