import ssl
import certifi
import os
import json
import aiohttp
import datetime

async def clean_up(json_data: str):
    # Parse the embedded JSON string
    data = json.loads(json_data)

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


async def generate_response(section_title: str, context: str, verbose: bool = False):
    prompt = f"""
    You are a trained medical professional analysis machine that is aiming to give helpful and insightful feedback to a medical student/Health Care Provider (HCP).
    The medical student just performed a medical interview with a standardized patient. 
    This medical student was scored upon criteria that fit into specific sections of a multi-sectioned rubric.
    You will be looking at one of those sections wherein the student needs improvement within a medical history taking interview.
    The section in question is titled [{section_title}]
    Here is a list of answers paired with questions from this section that highlight the HCP performances: [{context}]

    Please provide your response in the following JSON format:
            {{
                "strengths": "written examples of HCP strengths",
                "weaknesses": "written examples of HCP weaknesses"
                "coaching_tips": "written summary of coaching tips for the section as a whole"
            }}

    In the "strengths" field, highlight areas/questions wherein the HCP performed well.
    In the "weaknesses" field, highlight areas/questions wherein the HCP missed opportunites.
    In the "coaching_tips" field, generate a written summary of coaching tips for the section as a whole, 
    include some callouts to specific ways that the HCP can improve their interviewing skills in the future by referencing
    questions that had "NO" answers paired with them.
    """

    # Create the message list with the formatted content
    messages = [{"role": "user", "content": prompt}]

    api_url = "https://api.openai.com/v1/chat/completions"
    api_key = os.getenv("OPENAI_API_KEY")
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
        try:
            async with session.post(
                api_url, headers=headers, data=json.dumps(data)
            ) as response:
                if response.status == 200:
                    response_data = await response.json()  # Await the JSON response
                    # validate response structure
                    if "choices" in response_data and response_data["choices"]:
                        cleaned_response = await clean_up(
                            response_data["choices"][0]["message"]["content"].strip()
                        )
                    else:
                        return {
                            "error": "Failed to fetch response",
                            "status_code": response.status,
                            "details": response_data,
                        }
                    if verbose:
                        print("received: " + section_title)
                        print(cleaned_response)
                        print(cleaned_response["strengths"])

                    # Don't generate file for summary report right now
                    # fname = datetime.datetime.now().strftime("%I:%M:%S%p-on-%B-%d,-%Y")
                    # with open(f"{fname}.json", "w") as f:
                    #     json.dump(
                    #         {
                    #             "cleaned_response": cleaned_response,
                    #             "section_title": section_title,
                    #         },
                    #         f,
                    #     )

                    return cleaned_response, section_title
                else:
                    error_details = await response.text()  # Await the error details
                    return {
                        "error": "Failed to fetch response",
                        "status_code": response.status,
                        "details": error_details,
                    }
        except aiohttp.ClientError as e:
            return {"error": "Network error", "details": str(e)}
        except Exception as e:
            return {"error": str(e)}
