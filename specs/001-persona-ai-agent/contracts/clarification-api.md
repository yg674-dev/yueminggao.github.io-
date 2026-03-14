# Contract: Clarification Engine

**Type**: Internal JS module contract
**Module**: `js/clarification/engine.js`

## Interface

### `assessQuery(query, personaId, conversationHistory)`

Prepends the clarification gate to the persona's system prompt and calls the
active AI provider. Returns whether clarification is needed and what questions
to ask.

**Input**:
```json
{
  "query": "help me with my model",
  "personaId": "data-scientist",
  "conversationHistory": []
}
```

**Output (clarification needed)**:
```json
{
  "clarify": true,
  "questions": [
    "What type of model are you working with (classification, regression, clustering)?",
    "What's the target outcome — accuracy, speed, interpretability?",
    "What data do you have available?"
  ]
}
```

**Output (no clarification needed)**:
```json
{
  "clarify": false,
  "confirmedIntent": "User wants to debug a Python TypeError in a sklearn pipeline"
}
```

---

### `resolveIntent(questions, answers, personaId)`

Takes the clarification Q&A exchange and returns a confirmed intent summary.

**Input**:
```json
{
  "questions": ["What type of model?"],
  "answers": ["Binary classification with imbalanced data"],
  "personaId": "data-scientist"
}
```

**Output**:
```json
{
  "confirmedIntent": "User needs help building a binary classifier for imbalanced data — likely needs resampling strategies and evaluation metrics beyond accuracy"
}
```
