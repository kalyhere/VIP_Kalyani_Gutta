import math
from collections import Counter


def compute_tf(sentence):
    """Calculate term frequency for a single sentence."""
    words = sentence.split()
    tf_count = Counter(words)
    total_words = len(words)
    return {word: count / total_words for word, count in tf_count.items()}


def compute_idf(corpus):
    """Calculate inverse document frequency across the corpus."""
    num_documents = len(corpus)
    idf_count = Counter()

    # Count how many documents contain each word
    for sentence in corpus:
        unique_words = set(sentence.split())
        for word in unique_words:
            idf_count[word] += 1

    return {
        word: math.log(num_documents / (count + 1)) for word, count in idf_count.items()
    }


def compute_tfidf(sentence, idf):
    """Calculate TF-IDF for a single sentence using precomputed IDF values."""
    tf = compute_tf(sentence)
    tfidf = {word: tf_val * idf.get(word, 0) for word, tf_val in tf.items()}

    # Normalize the vector (L2 normalization)
    norm = math.sqrt(sum(val**2 for val in tfidf.values()))
    if norm > 0:
        tfidf = {word: val / norm for word, val in tfidf.items()}

    return tfidf


def cosine_similarity(vec1, vec2):
    """Calculate the cosine similarity between two vectors."""
    intersection = set(vec1.keys()) & set(vec2.keys())
    numerator = sum([vec1[x] * vec2[x] for x in intersection])

    sum1 = sum([vec1[x] ** 2 for x in vec1.keys()])
    sum2 = sum([vec2[x] ** 2 for x in vec2.keys()])

    denominator = math.sqrt(sum1) * math.sqrt(sum2)

    if not denominator:
        return 0.0
    else:
        return numerator / denominator


def calculate_cosine_scores(input_data: dict) -> dict:
    scores = {}

    for key, value in input_data.get("scoring_details", {}).items():
        # Extract the sentences
        original = value.get("original", "")
        best = value.get("best_version", "")
        worst = value.get("worst_version", "")

        # Handle missing sentences
        if not all([original, best, worst]):
            scores[key] = "Invalid data"
            continue

        # Create the corpus and calculate IDF
        corpus = [original, best, worst]
        idf = compute_idf(corpus)

        # Calculate TF-IDF for each sentence
        original_tfidf = compute_tfidf(original, idf)
        best_tfidf = compute_tfidf(best, idf)
        worst_tfidf = compute_tfidf(worst, idf)

        # Calculate cosine similarities
        similarity_to_best = cosine_similarity(original_tfidf, best_tfidf)
        similarity_to_worst = cosine_similarity(original_tfidf, worst_tfidf)

        # Derive the score
        score = 10 * (similarity_to_best - similarity_to_worst) + 5
        score = max(min(score, 10), 1)  # Ensure the score is within 1 to 10
        score = round(score, 2)

        # Store the score
        scores[key] = score

    return scores
