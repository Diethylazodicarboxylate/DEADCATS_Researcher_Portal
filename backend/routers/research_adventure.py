from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import get_current_user
from core.validation import clean_text, reject_html
from models.research_adventure import (
    AdventureDailyTask,
    ResearchAdventureProfile,
    UserAdventureSkill,
)
from models.user import User

router = APIRouter(prefix="/api/research-adventure", tags=["research_adventure"])

SEQUENCE_MILESTONES = [
    {"sequence": 9, "min_points": 0},
    {"sequence": 8, "min_points": 120},
    {"sequence": 7, "min_points": 280},
    {"sequence": 6, "min_points": 480},
    {"sequence": 5, "min_points": 730},
    {"sequence": 4, "min_points": 1040},
    {"sequence": 3, "min_points": 1420},
    {"sequence": 2, "min_points": 1880},
    {"sequence": 1, "min_points": 2430},
    {"sequence": 0, "min_points": 3090},
]

PATHWAYS = {
    "arcane_blade": {
        "key": "arcane_blade",
        "name": "Pathway of the Arcane Blade",
        "crest": "⚔️",
        "theme": "arcane",
        "core_concept": "All magic is a blade. All blades are spells.",
        "acting_method": "Precision, discipline, merging technique with understanding.",
        "sequences": [
            {"sequence": 9, "title": "Spell Initiate", "summary": "Imbues weapons with minor elemental effects."},
            {"sequence": 8, "title": "Runeblade Adept", "summary": "Engraves temporary runes while maintaining tempo."},
            {"sequence": 7, "title": "Mana Fencer", "summary": "Extends reach through invisible arcs of force."},
            {"sequence": 6, "title": "Sigil Duelist", "summary": "Turns sword forms into spell structures."},
            {"sequence": 5, "title": "Arcane Swordsman", "summary": "Erases the line between cast and strike."},
            {"sequence": 4, "title": "Blade Magus", "summary": "Layers multiple spell effects into one motion."},
            {"sequence": 3, "title": "Concept Cutter", "summary": "Cuts through intangible barriers and bindings."},
            {"sequence": 2, "title": "Law Severer", "summary": "Severs rules, defenses, and imposed limits."},
            {"sequence": 1, "title": "Supreme Spellblade", "summary": "Every motion becomes attack and incantation together."},
            {"sequence": 0, "title": "Embodiment of the Arcane Edge", "summary": "Becomes severance through understanding itself."},
        ],
    },
    "ruin_artificer": {
        "key": "ruin_artificer",
        "name": "Pathway of the Ruin Artificer",
        "crest": "⚙️",
        "theme": "ruin",
        "core_concept": "Creation is controlled destruction.",
        "acting_method": "Experimentation, obsession, improvement through failure.",
        "sequences": [
            {"sequence": 9, "title": "Tinkerer", "summary": "Builds compact tools and volatile mixtures."},
            {"sequence": 8, "title": "Mechanist", "summary": "Deploys autonomous traps, drones, and charges."},
            {"sequence": 7, "title": "Unstable Inventor", "summary": "Channels inspiration into dangerous prototypes."},
            {"sequence": 6, "title": "Forge Savant", "summary": "Fuses materials, systems, and abstract functions."},
            {"sequence": 5, "title": "War Engineer", "summary": "Constructs battlefield-shaping systems at scale."},
            {"sequence": 4, "title": "Living Workshop", "summary": "Turns the body into a manufacturing platform."},
            {"sequence": 3, "title": "Catastrophe Architect", "summary": "Designs chain reactions with cascading impact."},
            {"sequence": 2, "title": "Principle Breaker", "summary": "Ignores ordinary limits of energy and design."},
            {"sequence": 1, "title": "Origin Inventor", "summary": "Creates technologies that should not exist."},
            {"sequence": 0, "title": "The Great Ruin Machine", "summary": "Embodies invention and collapse in one engine."},
        ],
    },
    "shadow_conductor": {
        "key": "shadow_conductor",
        "name": "Pathway of the Shadow Conductor",
        "crest": "🕶️",
        "theme": "shadow",
        "core_concept": "Everything is part of the design.",
        "acting_method": "Observation, manipulation, indirect control, never acting openly.",
        "sequences": [
            {"sequence": 9, "title": "Observer", "summary": "Notices faint patterns and hidden signals."},
            {"sequence": 8, "title": "Planner", "summary": "Predicts short-term outcomes with accuracy."},
            {"sequence": 7, "title": "Subtle Manipulator", "summary": "Alters choices with minimal visible force."},
            {"sequence": 6, "title": "Web Weaver", "summary": "Maintains overlapping plans and influence chains."},
            {"sequence": 5, "title": "Hidden Director", "summary": "Shapes events without appearing involved."},
            {"sequence": 4, "title": "Polymath Savant", "summary": "Operates across disciplines with equal fluency."},
            {"sequence": 3, "title": "Fate Arranger", "summary": "Aligns coincidences until outcomes feel inevitable."},
            {"sequence": 2, "title": "Grand Orchestrator", "summary": "Moves organizations like unseen instruments."},
            {"sequence": 1, "title": "Shadow Sovereign", "summary": "Controls systems, wars, and knowledge flow silently."},
            {"sequence": 0, "title": "The Final Architect", "summary": "Reality bends to design, even through chaos."},
        ],
    },
}

SKILL_BRANCHES = [
    {
        "id": "web",
        "name": "Web Exploitation",
        "icon": "🌐",
        "theme": "arcane",
        "color": "#62d7ff",
        "source_hint": "OWASP Top 10 2025 + PortSwigger Web Security Academy",
        "skills": [
            {"id": "web-http-surface", "name": "HTTP Surface Mapping", "points": 30, "tier": 1, "prereqs": [], "summary": "Requests, responses, cookies, proxies, parameters, and attack surface inventory."},
            {"id": "web-auth-access", "name": "Auth and Access Control", "points": 45, "tier": 1, "prereqs": [], "summary": "Session handling, broken access control, IDOR, role abuse, and auth flow flaws."},
            {"id": "web-injection-core", "name": "Injection Core", "points": 55, "tier": 2, "prereqs": ["web-http-surface"], "summary": "SQLi, command injection, template injection, and query manipulation patterns."},
            {"id": "web-xss-csrf", "name": "Browser Abuse", "points": 45, "tier": 2, "prereqs": ["web-http-surface"], "summary": "Stored/reflected/DOM XSS, CSRF, clickjacking, and trust boundary abuse."},
            {"id": "web-api-graphql", "name": "API and GraphQL Testing", "points": 55, "tier": 3, "prereqs": ["web-auth-access", "web-injection-core"], "summary": "Schema abuse, mass assignment, BOLA, and API authorization gaps."},
            {"id": "web-ssrf-desync", "name": "Server-side Reach", "points": 60, "tier": 3, "prereqs": ["web-auth-access"], "summary": "SSRF, request smuggling, cache poisoning, and internal service pivoting."},
            {"id": "web-deserialization", "name": "State Integrity Attacks", "points": 65, "tier": 4, "prereqs": ["web-api-graphql"], "summary": "Deserialization, software/data integrity issues, insecure file handling, and supply-chain trust."},
            {"id": "web-logic-race", "name": "Logic and Race Condition Exploitation", "points": 75, "tier": 4, "prereqs": ["web-api-graphql", "web-ssrf-desync"], "summary": "Business logic flaws, payment/order abuse, race conditions, and sequencing bugs."},
            {"id": "web-cloud-modern", "name": "Modern App Attack Paths", "points": 80, "tier": 5, "prereqs": ["web-ssrf-desync", "web-deserialization"], "summary": "JWT/OAuth misuse, CI/CD exposure, cloud metadata abuse, and microservice trust breaks."},
            {"id": "web-researcher", "name": "Web Research Chain Mastery", "points": 110, "tier": 6, "prereqs": ["web-logic-race", "web-cloud-modern"], "summary": "Chains multiple medium flaws into reportable critical impact with reproducible research notes."},
        ],
    },
    {
        "id": "soc",
        "name": "SOC / SIEM",
        "icon": "📡",
        "theme": "shadow",
        "color": "#7bf6b8",
        "source_hint": "MITRE ATT&CK + detection engineering practices",
        "skills": [
            {"id": "soc-log-sources", "name": "Log Source Cartography", "points": 25, "tier": 1, "prereqs": [], "summary": "Endpoint, identity, network, cloud, DNS, proxy, and application telemetry coverage."},
            {"id": "soc-query-foundations", "name": "Query Language Fundamentals", "points": 35, "tier": 1, "prereqs": [], "summary": "Filtering, aggregation, joins, baselines, and search discipline in SIEM workflows."},
            {"id": "soc-alert-triage", "name": "Alert Triage", "points": 40, "tier": 2, "prereqs": ["soc-log-sources"], "summary": "Severity, evidence handling, false-positive review, and incident scoping."},
            {"id": "soc-attack-mapping", "name": "ATT&CK Mapping", "points": 45, "tier": 2, "prereqs": ["soc-query-foundations"], "summary": "Map detections, procedures, and hunts to attacker tactics and techniques."},
            {"id": "soc-detection-engineering", "name": "Detection Engineering", "points": 55, "tier": 3, "prereqs": ["soc-alert-triage", "soc-attack-mapping"], "summary": "Build resilient analytics, thresholds, suppression logic, and validation steps."},
            {"id": "soc-threat-hunting", "name": "Threat Hunting", "points": 55, "tier": 3, "prereqs": ["soc-query-foundations"], "summary": "Hypothesis-driven hunts using identity, endpoint, and network pivots."},
            {"id": "soc-usecase-tuning", "name": "Use-case Tuning", "points": 60, "tier": 4, "prereqs": ["soc-detection-engineering"], "summary": "Reduce noise while protecting fidelity with environment-aware tuning."},
            {"id": "soc-ir-workflows", "name": "IR Workflow Orchestration", "points": 65, "tier": 4, "prereqs": ["soc-threat-hunting", "soc-alert-triage"], "summary": "Escalation, enrichment, case notes, and containment handoff discipline."},
            {"id": "soc-daac", "name": "Detection as Code", "points": 75, "tier": 5, "prereqs": ["soc-usecase-tuning", "soc-ir-workflows"], "summary": "Versioned rules, Sigma/YARA alignment, CI validation, and change control."},
            {"id": "soc-hunt-lead", "name": "Hunt and Detection Lead", "points": 95, "tier": 6, "prereqs": ["soc-daac"], "summary": "Owns coverage strategy, purple-team feedback loops, and operational metrics."},
        ],
    },
    {
        "id": "binary",
        "name": "Binary Exploitation",
        "icon": "🧠",
        "theme": "ruin",
        "color": "#ff9964",
        "source_hint": "Exploit development foundations and defensive reverse-engineering practice",
        "skills": [
            {"id": "bin-assembly", "name": "Assembly and Calling Conventions", "points": 30, "tier": 1, "prereqs": [], "summary": "Registers, stack frames, syscalls, ABI basics, and control flow reading."},
            {"id": "bin-debugging", "name": "Debugger Fluency", "points": 35, "tier": 1, "prereqs": [], "summary": "Breakpoints, memory inspection, disassembly, and crash triage with modern debuggers."},
            {"id": "bin-memory-layout", "name": "Process Memory Layout", "points": 40, "tier": 2, "prereqs": ["bin-assembly"], "summary": "Stack, heap, GOT/PLT, ELF/PE basics, and common mitigations."},
            {"id": "bin-stack-bof", "name": "Stack Corruption", "points": 50, "tier": 2, "prereqs": ["bin-debugging", "bin-memory-layout"], "summary": "Buffer overflows, return control, canary awareness, and exploit reliability concepts."},
            {"id": "bin-format-strings", "name": "Memory Disclosure Primitives", "points": 50, "tier": 3, "prereqs": ["bin-stack-bof"], "summary": "Format strings, arbitrary read/write reasoning, and info leak setup."},
            {"id": "bin-rop", "name": "ROP and Code-Reuse", "points": 60, "tier": 3, "prereqs": ["bin-stack-bof"], "summary": "Gadget hunting, chain construction, NX bypass reasoning, and calling conventions in exploits."},
            {"id": "bin-heap", "name": "Heap Exploitation Concepts", "points": 70, "tier": 4, "prereqs": ["bin-format-strings", "bin-memory-layout"], "summary": "Allocators, corruption classes, and allocator-aware exploitation thinking."},
            {"id": "bin-mitigations", "name": "Mitigation Bypass Analysis", "points": 75, "tier": 4, "prereqs": ["bin-rop"], "summary": "ASLR, PIE, RELRO, sandboxing, and exploit path adaptation."},
            {"id": "bin-kernel-sandbox", "name": "Sandbox and Privilege Boundary Research", "points": 90, "tier": 5, "prereqs": ["bin-heap", "bin-mitigations"], "summary": "Boundary analysis for sandboxes, seccomp, and privilege isolation surfaces."},
            {"id": "bin-research", "name": "Exploit Research Mastery", "points": 120, "tier": 6, "prereqs": ["bin-kernel-sandbox"], "summary": "Turns crash classes into reproducible, well-documented exploit research."},
        ],
    },
    {
        "id": "malware",
        "name": "Malware Developer / Analyst",
        "icon": "☣️",
        "theme": "ruin",
        "color": "#ff5d73",
        "source_hint": "CISA malware analysis workflows + defensive reverse engineering",
        "skills": [
            {"id": "mal-triage", "name": "Sample Triage", "points": 25, "tier": 1, "prereqs": [], "summary": "Hashing, metadata, strings, packer hints, and quick capability assessment."},
            {"id": "mal-lab", "name": "Analysis Lab Discipline", "points": 35, "tier": 1, "prereqs": [], "summary": "Isolated execution, VM hygiene, snapshot use, and safe specimen handling."},
            {"id": "mal-static", "name": "Static Analysis", "points": 45, "tier": 2, "prereqs": ["mal-triage"], "summary": "Imports, resources, config extraction, and code structure review."},
            {"id": "mal-dynamic", "name": "Dynamic Analysis", "points": 45, "tier": 2, "prereqs": ["mal-lab"], "summary": "Behavior tracing, filesystem/network changes, and runtime observations."},
            {"id": "mal-persistence", "name": "Persistence and Execution Flow", "points": 55, "tier": 3, "prereqs": ["mal-static", "mal-dynamic"], "summary": "Autoruns, services, scheduled tasks, startup paths, and launch chains."},
            {"id": "mal-obfuscation", "name": "Obfuscation and Packing", "points": 60, "tier": 3, "prereqs": ["mal-static"], "summary": "Packer identification, string decryption patterns, and unpacking workflow."},
            {"id": "mal-c2", "name": "C2 and Network Behavior", "points": 60, "tier": 4, "prereqs": ["mal-dynamic", "mal-persistence"], "summary": "Beaconing, protocol fingerprints, config extraction, and indicator generation."},
            {"id": "mal-detection-content", "name": "Detection Content Creation", "points": 70, "tier": 4, "prereqs": ["mal-obfuscation"], "summary": "YARA, IOC generation, reporting, and defensive signatures with low noise."},
            {"id": "mal-family-tracking", "name": "Malware Family Tracking", "points": 80, "tier": 5, "prereqs": ["mal-c2", "mal-detection-content"], "summary": "Cluster samples into families, campaigns, and operator tradecraft."},
            {"id": "mal-analyst-lead", "name": "Campaign Analysis Lead", "points": 105, "tier": 6, "prereqs": ["mal-family-tracking"], "summary": "Produces operational analysis that directly improves response and detection."},
        ],
    },
    {
        "id": "ai",
        "name": "AI Security",
        "icon": "🧬",
        "theme": "arcane",
        "color": "#d7a2ff",
        "source_hint": "OWASP LLM Top 10 / GenAI Security Project",
        "skills": [
            {"id": "ai-architecture", "name": "LLM App Architecture", "points": 25, "tier": 1, "prereqs": [], "summary": "Models, prompts, context windows, embeddings, tools, and agent execution flow."},
            {"id": "ai-threat-modeling", "name": "AI Threat Modeling", "points": 35, "tier": 1, "prereqs": [], "summary": "Assets, trust boundaries, autonomy boundaries, and misuse cases for GenAI systems."},
            {"id": "ai-prompt-injection", "name": "Prompt Injection", "points": 45, "tier": 2, "prereqs": ["ai-architecture"], "summary": "Direct, indirect, tool-mediated, and context-hijack prompt attacks."},
            {"id": "ai-output-handling", "name": "Insecure Output Handling", "points": 45, "tier": 2, "prereqs": ["ai-architecture"], "summary": "Unsafe rendering, command execution, parser trust, and downstream sink control."},
            {"id": "ai-data-exposure", "name": "Sensitive Data Exposure", "points": 55, "tier": 3, "prereqs": ["ai-threat-modeling"], "summary": "Leakage through prompts, retrieval, memory, logs, and model responses."},
            {"id": "ai-supply-chain", "name": "Model and Supply Chain Risk", "points": 55, "tier": 3, "prereqs": ["ai-threat-modeling"], "summary": "Third-party models, datasets, MCP/tooling, plugins, and dependency trust."},
            {"id": "ai-agency", "name": "Excessive Agency", "points": 60, "tier": 4, "prereqs": ["ai-prompt-injection", "ai-output-handling"], "summary": "Over-permissioned agents, unsafe tool scopes, and action governance."},
            {"id": "ai-evals-guardrails", "name": "Evaluations and Guardrails", "points": 70, "tier": 4, "prereqs": ["ai-data-exposure"], "summary": "Security evals, policy tests, canaries, and behavior monitoring."},
            {"id": "ai-red-team", "name": "AI Red Teaming", "points": 80, "tier": 5, "prereqs": ["ai-agency", "ai-evals-guardrails"], "summary": "Structured adversarial testing across prompts, tools, memory, and orchestration."},
            {"id": "ai-security-lead", "name": "AI Security Lead", "points": 105, "tier": 6, "prereqs": ["ai-red-team", "ai-supply-chain"], "summary": "Defines secure AI deployment patterns and continuous validation strategy."},
        ],
    },
    {
        "id": "forensics",
        "name": "Digital Forensics",
        "icon": "🧾",
        "theme": "shadow",
        "color": "#ffe071",
        "source_hint": "NIST digital forensics guidance",
        "skills": [
            {"id": "df-evidence", "name": "Evidence Handling", "points": 25, "tier": 1, "prereqs": [], "summary": "Chain of custody, documentation, and acquisition planning."},
            {"id": "df-disk-acquisition", "name": "Disk Acquisition", "points": 35, "tier": 1, "prereqs": [], "summary": "Imaging, verification, hashing, and preserving original media."},
            {"id": "df-filesystems", "name": "Filesystem and Artifact Basics", "points": 45, "tier": 2, "prereqs": ["df-disk-acquisition"], "summary": "NTFS/ext/APFS fundamentals, timestamps, metadata, and common artifacts."},
            {"id": "df-timeline", "name": "Timeline Reconstruction", "points": 45, "tier": 2, "prereqs": ["df-evidence"], "summary": "Correlate logs, file events, execution traces, and user activity."},
            {"id": "df-memory", "name": "Memory Forensics", "points": 55, "tier": 3, "prereqs": ["df-filesystems"], "summary": "Processes, injected code, sockets, creds, and volatile artifact review."},
            {"id": "df-browser-user", "name": "User and Browser Artifacts", "points": 50, "tier": 3, "prereqs": ["df-filesystems"], "summary": "History, downloads, persistence traces, and user activity reconstruction."},
            {"id": "df-network", "name": "Network Forensics", "points": 60, "tier": 4, "prereqs": ["df-timeline"], "summary": "PCAP analysis, session reconstruction, and corroborating endpoint events."},
            {"id": "df-cloud-mobile", "name": "Cloud and Mobile Artifacts", "points": 65, "tier": 4, "prereqs": ["df-browser-user"], "summary": "Cloud audit trails, mobile traces, sync artifacts, and cross-device pivots."},
            {"id": "df-case-reporting", "name": "Case Reporting", "points": 70, "tier": 5, "prereqs": ["df-memory", "df-network"], "summary": "Communicate findings, confidence, and evidentiary support clearly."},
            {"id": "df-investigator", "name": "Lead Forensic Investigator", "points": 95, "tier": 6, "prereqs": ["df-cloud-mobile", "df-case-reporting"], "summary": "Owns multi-source investigations end-to-end with defensible reporting."},
        ],
    },
]

SKILL_INDEX = {
    skill["id"]: {**skill, "branch_id": branch["id"], "branch_name": branch["name"], "branch_icon": branch["icon"]}
    for branch in SKILL_BRANCHES
    for skill in branch["skills"]
}


class SelectPathwayRequest(BaseModel):
    pathway_key: str = Field(min_length=3, max_length=40)


class UnlockSkillRequest(BaseModel):
    skill_id: str = Field(min_length=3, max_length=80)


class CreateDailyTaskRequest(BaseModel):
    title: str = Field(min_length=3, max_length=140)
    points: int = Field(default=15, ge=5, le=30)
    due_date: date | None = None


def _apply_overdue_penalties(db: Session, user_id: int):
    today = date.today()
    overdue = (
        db.query(AdventureDailyTask)
        .filter(
            AdventureDailyTask.user_id == user_id,
            AdventureDailyTask.status == "pending",
            AdventureDailyTask.penalty_applied == False,
            AdventureDailyTask.due_date < today,
        )
        .all()
    )
    changed = False
    for task in overdue:
        task.status = "missed"
        task.penalty_applied = True
        changed = True
    if changed:
        db.commit()


def _skill_points_for_user(db: Session, user_id: int) -> int:
    rows = db.query(UserAdventureSkill).filter(UserAdventureSkill.user_id == user_id).all()
    return sum(int(row.points_awarded or 0) for row in rows)


def _task_points_breakdown(db: Session, user_id: int) -> tuple[int, int]:
    tasks = db.query(AdventureDailyTask).filter(AdventureDailyTask.user_id == user_id).all()
    completed = sum(int(task.points or 0) for task in tasks if task.status == "completed")
    penalties = sum(int(task.points or 0) for task in tasks if task.status == "missed" and task.penalty_applied)
    return completed, penalties


def _sequence_for_points(points: int) -> dict:
    non_negative = max(points, 0)
    current = SEQUENCE_MILESTONES[0]
    next_step = None
    for milestone in SEQUENCE_MILESTONES:
        if non_negative >= milestone["min_points"]:
            current = milestone
            continue
        next_step = milestone
        break
    return {
        "sequence": current["sequence"],
        "current_min_points": current["min_points"],
        "next_sequence": None if not next_step else next_step["sequence"],
        "next_min_points": None if not next_step else next_step["min_points"],
        "progress_points": non_negative - current["min_points"],
        "needed_points": 0 if not next_step else max(next_step["min_points"] - non_negative, 0),
    }


def _profile_for_user(db: Session, user: User):
    _apply_overdue_penalties(db, user.id)
    profile = db.query(ResearchAdventureProfile).filter(ResearchAdventureProfile.user_id == user.id).first()
    unlocked_rows = db.query(UserAdventureSkill).filter(UserAdventureSkill.user_id == user.id).all()
    unlocked_ids = {row.skill_id for row in unlocked_rows}
    unlocked_map = {row.skill_id: row for row in unlocked_rows}
    skill_points = _skill_points_for_user(db, user.id)
    task_points, penalty_points = _task_points_breakdown(db, user.id)
    total_points = skill_points + task_points - penalty_points
    seq_state = _sequence_for_points(total_points)
    pathway = PATHWAYS.get(profile.pathway_key) if profile else None

    branches = []
    for branch in SKILL_BRANCHES:
        branch_points = 0
        unlocked_count = 0
        skills = []
        for skill in branch["skills"]:
            row = unlocked_map.get(skill["id"])
            unlocked = row is not None
            available = (not unlocked) and all(req in unlocked_ids for req in skill["prereqs"])
            if unlocked:
                unlocked_count += 1
                branch_points += int(skill["points"])
            skills.append(
                {
                    **skill,
                    "unlocked": unlocked,
                    "available": available,
                    "unlocked_at": str(row.unlocked_at) if row and row.unlocked_at else None,
                }
            )
        branches.append(
            {
                "id": branch["id"],
                "name": branch["name"],
                "icon": branch["icon"],
                "theme": branch["theme"],
                "color": branch["color"],
                "source_hint": branch["source_hint"],
                "points_earned": branch_points,
                "skills_unlocked": unlocked_count,
                "skills_total": len(branch["skills"]),
                "skills": skills,
            }
        )

    tasks = (
        db.query(AdventureDailyTask)
        .filter(AdventureDailyTask.user_id == user.id)
        .order_by(AdventureDailyTask.due_date.asc(), AdventureDailyTask.created_at.asc())
        .all()
    )

    sequence_entry = None
    if pathway:
        sequence_entry = next(
            (entry for entry in pathway["sequences"] if entry["sequence"] == seq_state["sequence"]),
            pathway["sequences"][0],
        )

    return {
        "selected": bool(profile),
        "pathway": pathway,
        "selected_at": str(profile.selected_at) if profile and profile.selected_at else None,
        "sequence": sequence_entry,
        "sequence_progress": seq_state,
        "points": {
            "total": total_points,
            "skills": skill_points,
            "daily_completed": task_points,
            "daily_penalties": penalty_points,
        },
        "unlocked_skill_ids": sorted(unlocked_ids),
        "branches": branches,
        "daily_tasks": [task.to_dict() for task in tasks],
        "limits": {
            "max_daily_tasks": 5,
            "daily_task_create_window": "tomorrow_only",
        },
    }


def _require_profile(db: Session, user: User) -> ResearchAdventureProfile:
    _apply_overdue_penalties(db, user.id)
    profile = db.query(ResearchAdventureProfile).filter(ResearchAdventureProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=409, detail="Choose a pathway before using Research Adventure")
    return profile


@router.get("/meta")
def get_meta(_: User = Depends(get_current_user)):
    return {
        "pathways": list(PATHWAYS.values()),
        "sequence_milestones": SEQUENCE_MILESTONES,
        "branches": [
            {
                "id": branch["id"],
                "name": branch["name"],
                "icon": branch["icon"],
                "theme": branch["theme"],
                "color": branch["color"],
                "source_hint": branch["source_hint"],
                "skills": branch["skills"],
            }
            for branch in SKILL_BRANCHES
        ],
    }


@router.get("/me")
def get_my_adventure(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    return _profile_for_user(db, current)


@router.get("/profile/{handle}")
def get_public_adventure_profile(
    handle: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    user = db.query(User).filter(User.handle == handle).first()
    if not user:
        raise HTTPException(status_code=404, detail="Member not found")
    return _profile_for_user(db, user)


@router.post("/select-pathway", status_code=status.HTTP_201_CREATED)
def select_pathway(
    payload: SelectPathwayRequest,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    pathway_key = clean_text(payload.pathway_key, field="pathway_key", max_len=40).strip().lower()
    if pathway_key not in PATHWAYS:
        raise HTTPException(status_code=400, detail="Unknown pathway")
    existing = db.query(ResearchAdventureProfile).filter(ResearchAdventureProfile.user_id == current.id).first()
    if existing:
        raise HTTPException(status_code=409, detail="Pathway already chosen and cannot be changed")
    profile = ResearchAdventureProfile(user_id=current.id, pathway_key=pathway_key)
    db.add(profile)
    db.commit()
    return _profile_for_user(db, current)


@router.post("/unlock-skill", status_code=status.HTTP_201_CREATED)
def unlock_skill(
    payload: UnlockSkillRequest,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    _require_profile(db, current)
    skill_id = clean_text(payload.skill_id, field="skill_id", max_len=80).strip()
    skill = SKILL_INDEX.get(skill_id)
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    existing = (
        db.query(UserAdventureSkill)
        .filter(UserAdventureSkill.user_id == current.id, UserAdventureSkill.skill_id == skill_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Skill already unlocked")
    unlocked_ids = {
        row.skill_id
        for row in db.query(UserAdventureSkill).filter(UserAdventureSkill.user_id == current.id).all()
    }
    missing = [req for req in skill["prereqs"] if req not in unlocked_ids]
    if missing:
        raise HTTPException(status_code=400, detail="Unlock prerequisite skills first")
    row = UserAdventureSkill(user_id=current.id, skill_id=skill_id, points_awarded=int(skill["points"]))
    db.add(row)
    db.commit()
    return _profile_for_user(db, current)


@router.get("/daily-tasks")
def list_daily_tasks(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    _require_profile(db, current)
    return _profile_for_user(db, current)["daily_tasks"]


@router.post("/daily-tasks", status_code=status.HTTP_201_CREATED)
def create_daily_task(
    payload: CreateDailyTaskRequest,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    _require_profile(db, current)
    tomorrow = date.today() + timedelta(days=1)
    due_date = payload.due_date or tomorrow
    if due_date != tomorrow:
        raise HTTPException(status_code=400, detail="Daily tasks can only be planned for tomorrow")
    active_count = (
        db.query(AdventureDailyTask)
        .filter(
            AdventureDailyTask.user_id == current.id,
            AdventureDailyTask.status == "pending",
        )
        .count()
    )
    if active_count >= 5:
        raise HTTPException(status_code=400, detail="You can have at most 5 active daily tasks")
    task = AdventureDailyTask(
        user_id=current.id,
        title=reject_html(clean_text(payload.title, field="title", max_len=140), field="title"),
        points=int(payload.points),
        due_date=due_date,
    )
    db.add(task)
    db.commit()
    return _profile_for_user(db, current)


@router.post("/daily-tasks/{task_id}/complete")
def complete_daily_task(
    task_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    _require_profile(db, current)
    _apply_overdue_penalties(db, current.id)
    task = (
        db.query(AdventureDailyTask)
        .filter(AdventureDailyTask.id == task_id, AdventureDailyTask.user_id == current.id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.status == "missed":
        raise HTTPException(status_code=400, detail="Missed tasks cannot be completed")
    task.status = "completed"
    task.completed_at = datetime.now(timezone.utc)
    db.commit()
    return _profile_for_user(db, current)


@router.delete("/daily-tasks/{task_id}")
def delete_daily_task(
    task_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    _require_profile(db, current)
    _apply_overdue_penalties(db, current.id)
    task = (
        db.query(AdventureDailyTask)
        .filter(AdventureDailyTask.id == task_id, AdventureDailyTask.user_id == current.id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.status != "pending":
        raise HTTPException(status_code=400, detail="Only pending tasks can be deleted")
    db.delete(task)
    db.commit()
    return _profile_for_user(db, current)
