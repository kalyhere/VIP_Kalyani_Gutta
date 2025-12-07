import csv
import math
import re
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


class MedicalGlossary:
    def __init__(self, filepath):
        self.glossary_data = self._read_csv(filepath)
        self.term_to_definition = dict(
            (row["Medical Term"], row["Term Definition"]) for row in self.glossary_data
        )
        self.definition_to_term = dict(
            (row["Term Definition"], row["Medical Term"]) for row in self.glossary_data
        )

    def _read_csv(self, filepath):
        """Read a CSV file and return a list of dictionaries."""
        with open(filepath, newline="", encoding="utf-8") as csvfile:
            reader = csv.DictReader(csvfile)
            return [row for row in reader]

    def get_definition(self, term):
        return self.term_to_definition.get(term, "Definition not found")

    def get_term(self, definition):
        return self.definition_to_term.get(definition, "Term not found")

    def get_terms(self):
        return [row["Medical Term"] for row in self.glossary_data]

    def get_definitions(self):
        return [row["Term Definition"] for row in self.glossary_data]


class TranscriptAnalyzer:
    def __init__(self, transcript, glossary):
        self.transcript = transcript
        self.glossary = glossary
        self.definitions = self.glossary.get_definitions()
        self.idf = compute_idf(self.definitions)  # Compute IDF for the glossary

    def _get_context(self, line_num):
        # Helper function to get context (2 lines before and after)
        start = max(
            line_num - 3, 0
        )  # Adjust index for 0-based and ensure it's not negative
        end = min(
            line_num + 2, len(self.transcript)
        )  # Ensure it does not exceed transcript length
        return self.transcript[start:end]

    def search_terms(self):
        mentioned_terms = []
        for term in self.glossary.get_terms():
            definition = self.glossary.get_definition(term)
            for line_num, line in enumerate(self.transcript, 1):
                # Check if the line starts with a number followed by "D:"
                if ": D:" in line and re.search(
                    rf"\b{re.escape(term)}\b", line, re.IGNORECASE
                ):
                    context = self._get_context(line_num)
                    mentioned_terms.append((term, definition, line_num, line, context))
        return mentioned_terms

    def search_definitions(self):
        mentioned_definitions = []
        batch_size = 10
        for i in range(0, len(self.transcript), batch_size):
            batch_lines = self.transcript[i : i + batch_size]
            for j, line in enumerate(batch_lines):
                line_num = i + j + 1
                line_tfidf = compute_tfidf(
                    line, self.idf
                )  # Compute TF-IDF for the line
                for k, definition in enumerate(self.definitions):
                    definition_tfidf = compute_tfidf(
                        definition, self.idf
                    )  # Compute TF-IDF for the definition
                    sim_score = cosine_similarity(line_tfidf, definition_tfidf)
                    if sim_score >= 0.4:
                        possible_term = self.glossary.get_term(definition)
                        context = self._get_context(line_num)
                        mentioned_definitions.append(
                            (
                                possible_term,
                                definition,
                                line_num,
                                line,
                                context,
                                sim_score,
                            )
                        )

        # Sort the list in descending order based on the sim_score (6th element in tuple)
        mentioned_definitions.sort(key=lambda x: x[5], reverse=True)

        return mentioned_definitions


def medical_terminology(transcript: list, ama_glossary_filepath: str):
    glossary = MedicalGlossary(ama_glossary_filepath)
    analyzer = TranscriptAnalyzer(transcript, glossary)

    medical_terms_used = analyzer.search_terms()
    possible_definitions_used = analyzer.search_definitions()

    return medical_terms_used, possible_definitions_used
