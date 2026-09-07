 import { useState } from "react";

function CreateDecision() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [decisionType, setDecisionType] = useState("");
    const [createdBy, setCreatedBy] = useState("");
    const [teamId, setTeamId] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(
                "http://127.0.0.1:8000/decisions",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        title: title,
                        description: description,
                        decision_type: decisionType,
                        created_by: Number(createdBy),
                        team_id: teamId ? Number(teamId) : null
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.detail || "Failed to create");
                return;
            }

            setMessage("Created successfully");

            setTitle("");
            setDescription("");
            setDecisionType("");
            setCreatedBy("");
            setTeamId("");
        } catch {
            setMessage("Unable to connect to backend");
        }
    };

    return (
        <div>
            <h2>Create Decision</h2>

            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />

                <br /><br />

                <textarea
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                />

                <br /><br />

                <input
                    type="text"
                    placeholder="Decision Type"
                    value={decisionType}
                    onChange={(e) => setDecisionType(e.target.value)}
                    required
                />

                <br /><br />

                <input
                    type="number"
                    placeholder="Created By User ID"
                    value={createdBy}
                    onChange={(e) => setCreatedBy(e.target.value)}
                    required
                />

                <br /><br />

                <input
                    type="number"
                    placeholder="Team ID"
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                />

                <br /><br />

                <button type="submit">
                    Create
                </button>
            </form>

            <p>{message}</p>
        </div>
    );
}

export default CreateDecision;