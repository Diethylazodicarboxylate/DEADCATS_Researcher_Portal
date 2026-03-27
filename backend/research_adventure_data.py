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

SPECIALIZATIONS = [
    {
        "id": "web",
        "name": "Web Exploitation",
        "icon": "🌐",
        "theme": "arcane",
        "color": "#62d7ff",
        "summary": "Browser, protocol, framework, auth, and distributed system security as a full-stack research discipline.",
        "levels": [
            {
                "id": "web-l1",
                "name": "Level 1",
                "title": "Web Substrate Mastery",
                "summary": "Understand how browsers, protocols, and auth systems actually behave before chasing bug classes.",
                "topics": [
                    {
                        "id": "web-browser-platform",
                        "name": "Browser and Platform Model",
                        "summary": "Build precise mental models for client-side trust boundaries and browser execution behavior.",
                        "skills": [
                            {"id": "web-url-parsing", "name": "URL parsing edge cases", "summary": "Normalization, parser discrepancies, and how URLs mutate across layers.", "points": 10},
                            {"id": "web-origin-sop", "name": "Origin model and same-origin policy", "summary": "Origin calculation, site concepts, SOP limits, and site isolation reasoning.", "points": 10},
                            {"id": "web-cookies-storage", "name": "Cookies and storage primitives", "summary": "Cookies, local/session storage, IndexedDB, and state handling risks.", "points": 10},
                            {"id": "web-cors-csp", "name": "CORS and CSP", "summary": "Cross-origin access control and browser-enforced policy design.", "points": 10},
                            {"id": "web-iframes-message", "name": "iframes and postMessage", "summary": "Cross-window communication and embedding trust boundaries.", "points": 10},
                            {"id": "web-dom-js-runtime", "name": "DOM parsing and JS execution model", "summary": "HTML parser quirks, event loop, microtasks, and script execution timing.", "points": 10},
                            {"id": "web-sw-nav", "name": "Service workers and navigation lifecycle", "summary": "Request interception, caching, navigation, fetch/XHR semantics, and hydration.", "points": 10},
                            {"id": "web-mixed-permissions", "name": "Mixed content and permissions model", "summary": "Secure context rules and browser permission surfaces.", "points": 10},
                        ],
                    },
                    {
                        "id": "web-http-architecture",
                        "name": "HTTP and Application Architecture",
                        "summary": "Understand how requests transform across clients, proxies, frameworks, and distributed backends.",
                        "skills": [
                            {"id": "web-request-normalization", "name": "Request and response normalization", "summary": "Header folding, path normalization, and proxy/frontend/backend interpretation drift.", "points": 10},
                            {"id": "web-cache-cdn", "name": "Cache semantics and CDN behavior", "summary": "Caching rules, edge behavior, and content negotiation impact.", "points": 10},
                            {"id": "web-encoding-methods", "name": "Compression, chunking, and method handling", "summary": "Transfer semantics, method overrides, redirects, and header trust boundaries.", "points": 10},
                            {"id": "web-frontend-backend-desync", "name": "Backend/frontend desync mindset", "summary": "Think in parser disagreement and async trust transitions.", "points": 10},
                            {"id": "web-rendering-models", "name": "SSR, CSR, and hydration models", "summary": "Rendering paths, state hydration, and trust split between client and server.", "points": 10},
                            {"id": "web-distributed-patterns", "name": "Microservices, queues, and webhooks", "summary": "Gateways, async processing, event delivery, and webhook trust models.", "points": 10},
                        ],
                    },
                    {
                        "id": "web-auth-foundations",
                        "name": "Authentication and Authorization Foundations",
                        "summary": "Learn how identity, delegation, recovery, and tenancy boundaries actually fail.",
                        "skills": [
                            {"id": "web-session-csrf", "name": "Session management and CSRF", "summary": "Session lifecycle, token handling, and browser-assisted request abuse.", "points": 10},
                            {"id": "web-oauth-oidc-saml", "name": "OAuth 2.0, OIDC, and SAML", "summary": "Federated login, assertions, and token trust chains.", "points": 10},
                            {"id": "web-scim-mfa", "name": "SCIM, MFA, and device trust", "summary": "Provisioning, factor lifecycle, trusted device models, and recovery flows.", "points": 10},
                            {"id": "web-delegation-rbac", "name": "Delegation chains and authorization models", "summary": "RBAC, ABAC, ReBAC, impersonation, and delegated authority.", "points": 10},
                            {"id": "web-tenancy", "name": "Tenancy boundaries", "summary": "Multi-tenant access scoping, cross-tenant leakage, and boundary validation.", "points": 10},
                        ],
                    },
                ],
            },
            {
                "id": "web-l2",
                "name": "Level 2",
                "title": "Primitive Classes to Master Conceptually",
                "summary": "Study each class by root cause, exploit preconditions, mitigations, variants, and prevention strategy.",
                "topics": [
                    {
                        "id": "web-input-injection",
                        "name": "Input Handling and Injection Classes",
                        "summary": "Reason about server-side trust failures as parser and sink problems, not just payload tricks.",
                        "skills": [
                            {"id": "web-sqli-nosqli", "name": "SQLi, NoSQLi, and ORM/query-builder trust failures", "summary": "Query construction risk across direct and abstracted data layers.", "points": 12},
                            {"id": "web-template-expression", "name": "Template and expression injection", "summary": "Server-side templating, expression evaluation, and render-time code paths.", "points": 12},
                            {"id": "web-command-argument", "name": "Command and argument injection", "summary": "Shell, process invocation, and unsafe command composition.", "points": 12},
                            {"id": "web-path-file-include", "name": "Path traversal and file inclusion classes", "summary": "Unsafe path resolution, include mechanics, and archive extraction trust.", "points": 12},
                            {"id": "web-ssrf-xml", "name": "SSRF and XML parser risks", "summary": "Server-side request pivoting and parser-driven outbound trust abuse.", "points": 12},
                            {"id": "web-deserialization", "name": "Deserialization and regex-driven denial risks", "summary": "Unsafe object materialization and parser-driven resource exhaustion.", "points": 12},
                            {"id": "web-header-log-graphql", "name": "Header, log, and GraphQL trust failures", "summary": "CRLF, mail/header trust, log injection, and resolver misuse.", "points": 12},
                        ],
                    },
                    {
                        "id": "web-browser-side",
                        "name": "Browser-side Classes",
                        "summary": "Treat browser flaws as execution context, DOM trust, and side-channel problems.",
                        "skills": [
                            {"id": "web-xss-contexts", "name": "XSS families as execution-context problems", "summary": "Context-aware script execution, DOM trust edges, and sanitization gaps.", "points": 12},
                            {"id": "web-script-gadget", "name": "Script gadgets and client-side template misuse", "summary": "Execution without classic sinks through trusted code gadgets.", "points": 12},
                            {"id": "web-prototype-pollution", "name": "Prototype pollution impact modeling", "summary": "Prototype mutation as a path to auth, rendering, or logic compromise.", "points": 12},
                            {"id": "web-ui-redress", "name": "Clickjacking and UI redress", "summary": "UI-layer trust abuse and cross-window confusion.", "points": 12},
                            {"id": "web-xsleaks", "name": "XS-Leaks and cache probing", "summary": "Side-channel and cross-origin data inference techniques.", "points": 12},
                            {"id": "web-csp-bypass", "name": "CSP bypass research methodology", "summary": "Policy weakening, gadget hunting, and execution without obvious sinks.", "points": 12},
                        ],
                    },
                    {
                        "id": "web-access-logic",
                        "name": "Access Control and Logic Flaws",
                        "summary": "Study authorization and workflow weaknesses as trust-transition failures.",
                        "skills": [
                            {"id": "web-idor-function-auth", "name": "IDOR and function-level authorization gaps", "summary": "Object, route, and action authorization failures.", "points": 12},
                            {"id": "web-tenant-workflow", "name": "Tenant isolation and workflow abuse", "summary": "Cross-tenant drift, state machine flaws, and approval bypass.", "points": 12},
                            {"id": "web-race-replay", "name": "Race conditions and replay issues", "summary": "Concurrent state abuse and replay of privileged transitions.", "points": 12},
                            {"id": "web-billing-hidden-authority", "name": "Billing logic and hidden client authority", "summary": "Coupon, credit, hidden fields, and partial object update abuse.", "points": 12},
                            {"id": "web-admin-support", "name": "Admin, support, and feature-flag abuse", "summary": "Internal tooling as an attack surface with weak guardrails.", "points": 12},
                        ],
                    },
                    {
                        "id": "web-infra-facing",
                        "name": "Infrastructure-facing Web Classes",
                        "summary": "Understand web behavior where proxies, edge platforms, and document pipelines meet.",
                        "skills": [
                            {"id": "web-request-smuggling", "name": "Request smuggling and desync mindset", "summary": "Parser disagreement between intermediaries and origins.", "points": 12},
                            {"id": "web-cache-poisoning", "name": "Cache poisoning and deception", "summary": "Caching abuse across keys, headers, and path normalization.", "points": 12},
                            {"id": "web-host-proxy", "name": "Host header and proxy header trust", "summary": "Origin selection, routing, and header-derived authority.", "points": 12},
                            {"id": "web-metadata-webhooks", "name": "Internal APIs, metadata exposure, and webhooks", "summary": "Server-side reachability and trusted inbound event abuse.", "points": 12},
                            {"id": "web-file-upload-parsers", "name": "File upload and multi-parser discrepancies", "summary": "Upload pipelines, parser differential behavior, and document/image trust.", "points": 12},
                        ],
                    },
                ],
            },
            {
                "id": "web-l3",
                "name": "Level 3",
                "title": "Framework and Ecosystem Expertise",
                "summary": "Learn framework internals and repeat failure modes instead of memorizing one-off bugs.",
                "topics": [
                    {
                        "id": "web-backend-frameworks",
                        "name": "Backend Framework Internals",
                        "summary": "Understand routing, middleware, serialization, validation, and session behavior in major stacks.",
                        "skills": [
                            {"id": "web-node-express", "name": "Node, Express, and Nest", "summary": "Middleware ordering, trust proxies, file handling, and auth composition.", "points": 14},
                            {"id": "web-python-stacks", "name": "Django, Flask, and FastAPI", "summary": "Templating, dependency injection, serialization, and upload/validation pipelines.", "points": 14},
                            {"id": "web-java-spring", "name": "Spring and Java enterprise stacks", "summary": "Controller binding, filters, deserialization, and auth middleware ordering.", "points": 14},
                            {"id": "web-php-ruby", "name": "Rails, Laravel, and PHP ecosystems", "summary": "Convention-driven frameworks and their common trust assumptions.", "points": 14},
                            {"id": "web-aspnet", "name": "ASP.NET ecosystems", "summary": "Pipeline ordering, claims handling, and serialization/security integration.", "points": 14},
                        ],
                    },
                    {
                        "id": "web-api-runtime-frameworks",
                        "name": "APIs, Edge, and Runtime Boundaries",
                        "summary": "Map trust transitions in modern platform and API-first deployments.",
                        "skills": [
                            {"id": "web-graphql-servers", "name": "GraphQL server internals", "summary": "Resolvers, batching, schema trust, and auth boundaries.", "points": 14},
                            {"id": "web-grpc-web", "name": "gRPC and web-adjacent boundaries", "summary": "Protocol translation, gateway assumptions, and serialization boundaries.", "points": 14},
                            {"id": "web-serverless-edge", "name": "Serverless platforms and edge runtimes", "summary": "Ephemeral execution, secrets, request context, and event-driven trust.", "points": 14},
                        ],
                    },
                    {
                        "id": "web-modern-frontends",
                        "name": "Modern Frontends and SSR Frameworks",
                        "summary": "Understand client/server split, hydration, and secret/data handling in modern frontend stacks.",
                        "skills": [
                            {"id": "web-react-vue-angular", "name": "React, Vue, and Angular trust boundaries", "summary": "Rendering, templating, component state, and dangerous escape hatches.", "points": 14},
                            {"id": "web-next-ssr", "name": "Next.js and SSR framework risks", "summary": "Hydration, server actions, data fetching, and auth context composition.", "points": 14},
                            {"id": "web-csp-secrets-auth-composition", "name": "CSP, secret handling, and auth middleware composition", "summary": "Security controls frequently miswired in production builds.", "points": 14},
                        ],
                    },
                ],
            },
            {
                "id": "web-l4",
                "name": "Level 4",
                "title": "Researcher-grade Practice",
                "summary": "Turn primitives and framework knowledge into repeatable research methodology.",
                "topics": [
                    {
                        "id": "web-variant-hunting",
                        "name": "Variant Hunting and Root Cause Analysis",
                        "summary": "Trace bug classes across patches, sinks, and framework behaviors.",
                        "skills": [
                            {"id": "web-variant-from-patch", "name": "Variant hunting from one bug to a class", "summary": "Use one flaw to enumerate neighboring trust failures.", "points": 16},
                            {"id": "web-patch-diff-source-review", "name": "Patch diff analysis and source-assisted review", "summary": "Diffs, code archaeology, and source/sink mapping.", "points": 16},
                            {"id": "web-taint-threat-modeling", "name": "Taint mindset and complex flow threat modeling", "summary": "Track trust transitions through modern app flows.", "points": 16},
                        ],
                    },
                    {
                        "id": "web-chain-building",
                        "name": "Chain Construction and Business Logic",
                        "summary": "Find high-impact outcomes by composing medium-severity issues.",
                        "skills": [
                            {"id": "web-business-logic-surface", "name": "Business logic as attack surface", "summary": "Turn workflows and assumptions into testable exploit hypotheses.", "points": 16},
                            {"id": "web-impossible-bugs", "name": "Finding impossible bugs through trust transitions", "summary": "Identify edge cases where one layer invalidates another.", "points": 16},
                            {"id": "web-medium-to-critical-chains", "name": "Constructing exploit chains from medium issues", "summary": "Combine auth, cache, parser, and logic flaws into real impact.", "points": 16},
                        ],
                    },
                    {
                        "id": "web-custom-research-tooling",
                        "name": "Custom Instrumentation and Triage",
                        "summary": "Use custom tooling to validate hypotheses and system drift.",
                        "skills": [
                            {"id": "web-minimal-repro-apps", "name": "Minimal repro apps for framework weakness isolation", "summary": "Reduce complex systems to reproducible edge cases.", "points": 16},
                            {"id": "web-security-advisory-derivation", "name": "Deriving variants from advisories", "summary": "Study browser and framework advisories to find adjacent flaws.", "points": 16},
                            {"id": "web-static-dynamic-probes", "name": "Static checks, linters, and dynamic probes", "summary": "Semgrep-style checks, auth drift probes, and cache/header instrumentation.", "points": 16},
                            {"id": "web-triage-discipline", "name": "Impact and reliability triage discipline", "summary": "Preconditions, exploitability, and durable root cause communication.", "points": 16},
                        ],
                    },
                ],
            },
            {
                "id": "web-l5",
                "name": "Level 5",
                "title": "World-class Output",
                "summary": "Produce original, precise, reusable research rather than isolated bug trophies.",
                "topics": [
                    {
                        "id": "web-world-class-output",
                        "name": "World-class Research Deliverables",
                        "summary": "Turn deep technical insight into durable output others can use.",
                        "skills": [
                            {"id": "web-original-bug-classes", "name": "Original bug classes and mitigation bypasses", "summary": "Define classes of flaws and demonstrate why controls fail.", "points": 20},
                            {"id": "web-variant-framework-analysis", "name": "Variant analysis across frameworks and vendors", "summary": "Prove root cause travels across ecosystems.", "points": 20},
                            {"id": "web-boundary-insights", "name": "Browser and app boundary insights", "summary": "Explain where platform assumptions break in practice.", "points": 20},
                            {"id": "web-root-cause-writeups", "name": "Precise root-cause writeups and patch guidance", "summary": "Document issues with exact failure conditions and remediation.", "points": 20},
                            {"id": "web-negative-testing-frameworks", "name": "Negative testing and reusable review frameworks", "summary": "Convert research into repeatable testing strategy for teams.", "points": 20},
                        ],
                    }
                ],
            },
        ],
    },
    {
        "id": "soc",
        "name": "SOC / SIEM",
        "icon": "📡",
        "theme": "shadow",
        "color": "#7bf6b8",
        "summary": "Detection science, telemetry engineering, adversary tradecraft modeling, and incident decision support.",
        "levels": [
            {
                "id": "soc-l1",
                "name": "Level 1",
                "title": "Operational Substrate",
                "summary": "Understand the telemetry, identity, and workflow substrate before writing detections.",
                "topics": [
                    {
                        "id": "soc-platform-substrate",
                        "name": "Platform and Identity Architecture",
                        "summary": "Know how hosts, identity, and control planes generate and shape evidence.",
                        "skills": [
                            {"id": "soc-win-linux-macos", "name": "Windows, Linux, and macOS internals for telemetry", "summary": "OS behavior that determines what can be logged and trusted.", "points": 10},
                            {"id": "soc-ad-entra", "name": "AD, Entra, and identity architecture", "summary": "Identity topology and signal locations for auth and privilege events.", "points": 10},
                            {"id": "soc-edr-siem-architecture", "name": "EDR and SIEM architecture", "summary": "Sensors, collection, transport, indexing, and analytics flow.", "points": 10},
                        ],
                    },
                    {
                        "id": "soc-log-pipeline-substrate",
                        "name": "Log Pipeline Engineering",
                        "summary": "Understand how data quality, enrichment, and retention shape detection quality.",
                        "skills": [
                            {"id": "soc-schema-normalization", "name": "Event schema normalization", "summary": "Field shape, semantic consistency, and cross-source entity stitching.", "points": 10},
                            {"id": "soc-retention-time", "name": "Retention and time synchronization tradeoffs", "summary": "Clock skew, retention windows, and what they do to investigations.", "points": 10},
                            {"id": "soc-enrichment-dac", "name": "Enrichment pipelines and detection-as-code", "summary": "Enrichment strategy, version control, and repeatable content deployment.", "points": 10},
                        ],
                    },
                    {
                        "id": "soc-ops-economics",
                        "name": "Operational Economics",
                        "summary": "Measure the real cost of noise and workflow breakdowns.",
                        "skills": [
                            {"id": "soc-fp-economics", "name": "False positive economics and alert fatigue", "summary": "Why low-fidelity detections collapse analyst capacity.", "points": 10},
                            {"id": "soc-case-intel-taxonomy", "name": "Case management and intelligence lifecycle", "summary": "Analyst workflow, evidence handling, and intel consumption.", "points": 10},
                            {"id": "soc-attack-taxonomy", "name": "ATT&CK as taxonomy, not truth", "summary": "Use ATT&CK for language and coverage, not as a substitute for analysis.", "points": 10},
                        ],
                    },
                ],
            },
            {
                "id": "soc-l2",
                "name": "Level 2",
                "title": "Telemetry Mastery",
                "summary": "Know what telemetry proves, suggests, or misses across endpoints, identity, network, and cloud.",
                "topics": [
                    {
                        "id": "soc-endpoint-telemetry",
                        "name": "Endpoint Telemetry",
                        "summary": "Master host-level signals and their blind spots.",
                        "skills": [
                            {"id": "soc-proc-cmdline", "name": "Process creation and command line interpretation", "summary": "Parent-child relationships, command-line context, and process lineage.", "points": 12},
                            {"id": "soc-modules-services-registry", "name": "Modules, registry/config, services, and tasks", "summary": "Configuration drift, scheduled execution, and service creation visibility.", "points": 12},
                            {"id": "soc-wmi-amsi-scripting", "name": "WMI, AMSI, and scripting telemetry", "summary": "Script execution visibility and common blind spots.", "points": 12},
                            {"id": "soc-sysmon-etw-audit", "name": "Sysmon, ETW, and audit policy design", "summary": "Host telemetry design and the compromises required in production.", "points": 12},
                            {"id": "soc-edr-blind-spots", "name": "EDR sensor blind spots", "summary": "Know what your endpoint platform does not or cannot see.", "points": 12},
                        ],
                    },
                    {
                        "id": "soc-identity-telemetry",
                        "name": "Identity Telemetry",
                        "summary": "Treat identity as a primary signal source, not just a log type.",
                        "skills": [
                            {"id": "soc-kerberos-ntlm-federation", "name": "Kerberos, NTLM, and federation basics", "summary": "Auth flows and where identity evidence appears or degrades.", "points": 12},
                            {"id": "soc-mfa-ca", "name": "MFA and conditional access telemetry", "summary": "Factor use, device posture, and identity control signals.", "points": 12},
                            {"id": "soc-token-reset-privilege", "name": "Token issuance, resets, and privilege change events", "summary": "High-value auth lifecycle events and what they imply.", "points": 12},
                        ],
                    },
                    {
                        "id": "soc-network-cloud-telemetry",
                        "name": "Network and Cloud Telemetry",
                        "summary": "Correlate network, SaaS, and cloud control plane behavior into investigations.",
                        "skills": [
                            {"id": "soc-dns-proxy-flow", "name": "DNS, proxy, and flow logs", "summary": "Traffic-level evidence and inference limits.", "points": 12},
                            {"id": "soc-email-saas-cloud", "name": "Email, SaaS, and control plane logs", "summary": "Operational telemetry across cloud and SaaS systems.", "points": 12},
                            {"id": "soc-object-storage-iam-serverless", "name": "Object storage, IAM, serverless, and orchestration logs", "summary": "High-value audit sources for cloud misuse and privilege drift.", "points": 12},
                        ],
                    },
                ],
            },
            {
                "id": "soc-l3",
                "name": "Level 3",
                "title": "Detection Engineering",
                "summary": "Design detections with explicit evidence models, evasion assumptions, and operational tuning.",
                "topics": [
                    {
                        "id": "soc-behavior-domains",
                        "name": "Threat Behavior Domains",
                        "summary": "Map telemetry to attacker behavior with clear proof thresholds and benign lookalikes.",
                        "skills": [
                            {"id": "soc-cred-priv-persist", "name": "Credential access, privilege escalation, and persistence", "summary": "Behavioral evidence models for high-value attacker objectives.", "points": 14},
                            {"id": "soc-evasion-exec-movement", "name": "Defense evasion, remote execution, and lateral movement", "summary": "Correlate noisy and subtle signals into durable detection logic.", "points": 14},
                            {"id": "soc-exfil-staging-beaconing", "name": "Exfiltration, staging, and beaconing analytics", "summary": "Model data movement and communication behavior under evasion pressure.", "points": 14},
                            {"id": "soc-lolbins-mailbox-oauth", "name": "LOLBins, mailbox abuse, and OAuth misuse", "summary": "Legitimate surfaces that become attacker infrastructure.", "points": 14},
                            {"id": "soc-insider-ransomware", "name": "Insider anomaly and ransomware precursor modeling", "summary": "Behavior-first reasoning with control-plane, host, and user evidence.", "points": 14},
                        ],
                    },
                    {
                        "id": "soc-query-analytics",
                        "name": "Query and Analytics Craft",
                        "summary": "Learn to express strong analytical logic across query languages and statistical baselines.",
                        "skills": [
                            {"id": "soc-sigma-kql-spl-sql", "name": "Sigma, KQL, SPL, and SQL in telemetry contexts", "summary": "Portable rule logic and platform-specific implementation.", "points": 14},
                            {"id": "soc-parsing-baselining", "name": "Parsing, regex, and baselining", "summary": "Field extraction and baseline construction for real-world data.", "points": 14},
                            {"id": "soc-anomaly-threshold-sequence", "name": "Anomaly, threshold, and sequence detection", "summary": "Understand statistical limits and durable temporal correlation.", "points": 14},
                            {"id": "soc-risk-suppression-purple", "name": "Risk scoring, suppression tuning, and purple validation", "summary": "Tune precision, recall, and operational confidence.", "points": 14},
                        ],
                    },
                ],
            },
            {
                "id": "soc-l4",
                "name": "Level 4",
                "title": "Hunt and Response Mindset",
                "summary": "Turn signals into scoped incidents, reconstructed campaigns, and durable engineering feedback.",
                "topics": [
                    {
                        "id": "soc-investigation-method",
                        "name": "Investigation Method",
                        "summary": "Use evidence, confidence, and contamination controls to hunt and scope incidents.",
                        "skills": [
                            {"id": "soc-hypothesis-hunting", "name": "Hypothesis-driven hunting", "summary": "Start with behavior hypotheses, not just IOC lookups.", "points": 16},
                            {"id": "soc-campaign-reconstruction", "name": "Campaign reconstruction and objective inference", "summary": "Build timelines and explain adversary intent with restraint.", "points": 16},
                            {"id": "soc-confidence-contamination", "name": "Confidence scoring and contamination avoidance", "summary": "Express evidence strength and avoid tainting your own analysis.", "points": 16},
                        ],
                    },
                    {
                        "id": "soc-response-design",
                        "name": "Scoping and Response Design",
                        "summary": "Scope fast, escalate correctly, and convert incidents into durable controls.",
                        "skills": [
                            {"id": "soc-scope-link-evidence", "name": "Timeline building and host-identity-network linkage", "summary": "Correlate sparse evidence into a bounded incident picture.", "points": 16},
                            {"id": "soc-telemetry-gaps-escalation", "name": "Telemetry gaps and escalation criteria", "summary": "Know when your logs lie and when to call for deeper response.", "points": 16},
                            {"id": "soc-containment-playbooks", "name": "Containment strategy and playbook design", "summary": "Make response decisions that fit evidence quality and business risk.", "points": 16},
                            {"id": "soc-post-incident-hardening", "name": "Post-incident hardening and durable detections", "summary": "Convert incidents into controls and new detection content.", "points": 16},
                        ],
                    },
                ],
            },
            {
                "id": "soc-l5",
                "name": "Level 5",
                "title": "World-class SOC / SIEM Output",
                "summary": "Move beyond alert consumption into telemetry strategy and adversary-resilient detection engineering.",
                "topics": [
                    {
                        "id": "soc-world-class-output",
                        "name": "World-class Detection and Operations",
                        "summary": "Create durable detections, measurable coverage, and operational change.",
                        "skills": [
                            {"id": "soc-detections-survive-drift", "name": "Detections that survive adversary drift", "summary": "Engineer logic that tolerates minor tradecraft changes.", "points": 20},
                            {"id": "soc-telemetry-strategy", "name": "Telemetry strategy, not just rules", "summary": "Shape collection, enrichment, and retention to support investigations.", "points": 20},
                            {"id": "soc-coverage-models", "name": "Measurable coverage and attack-path mapping", "summary": "Map signal quality and control gaps to adversary objectives.", "points": 20},
                            {"id": "soc-high-signal-investigations", "name": "High-signal investigations with preserved human judgment", "summary": "Use automation without collapsing analyst reasoning.", "points": 20},
                            {"id": "soc-lessons-into-engineering", "name": "Incident lessons converted into engineering", "summary": "Make post-incident insights durable across process and technology.", "points": 20},
                        ],
                    }
                ],
            },
        ],
    },
    {
        "id": "binary",
        "name": "Binary Exploitation Research",
        "icon": "🧠",
        "theme": "ruin",
        "color": "#ff9964",
        "summary": "Defensive native-code vulnerability research, exploitability analysis, reverse engineering, and mitigation design.",
        "levels": [
            {
                "id": "binary-l1",
                "name": "Level 1",
                "title": "Native Code Foundations",
                "summary": "Understand memory, ABIs, loaders, object formats, and compiler behavior before vulnerability research.",
                "topics": [
                    {
                        "id": "binary-memory-foundations",
                        "name": "Memory and Language Foundations",
                        "summary": "Learn how native code represents data, lifetime, and undefined behavior.",
                        "skills": [
                            {"id": "binary-memory-layout", "name": "C/C++ memory model", "summary": "Stack, heap, globals, TLS, and storage duration.", "points": 10},
                            {"id": "binary-layout-alignment", "name": "Structs, unions, alignment, and padding", "summary": "Object layout and layout-driven bug origins.", "points": 10},
                            {"id": "binary-abi-calls", "name": "ABI and calling conventions", "summary": "Register usage, calling discipline, and function boundaries.", "points": 10},
                            {"id": "binary-ub-integers-pointers", "name": "Undefined behavior, integer behavior, and pointer provenance", "summary": "The roots of many native-code reliability and security bugs.", "points": 10},
                            {"id": "binary-atomics-concurrency", "name": "Atomics and concurrency bugs", "summary": "Memory ordering, races, and concurrent corruption patterns.", "points": 10},
                        ],
                    },
                    {
                        "id": "binary-loader-formats",
                        "name": "Loader and Binary Formats",
                        "summary": "Understand how compiled code is loaded, relocated, and executed on real platforms.",
                        "skills": [
                            {"id": "binary-compiler-output", "name": "Compiler output reading and optimization side effects", "summary": "Map source assumptions to actual machine-level behavior.", "points": 10},
                            {"id": "binary-linker-loader", "name": "Linker and loader behavior", "summary": "Relocations, symbol resolution, and runtime layout effects.", "points": 10},
                            {"id": "binary-elf-pe-macho", "name": "ELF, PE, and Mach-O internals", "summary": "Platform object formats and their security-relevant structures.", "points": 10},
                            {"id": "binary-plt-got", "name": "PLT and GOT concepts", "summary": "Late binding and how indirection shapes runtime trust.", "points": 10},
                        ],
                    },
                ],
            },
            {
                "id": "binary-l2",
                "name": "Level 2",
                "title": "Vulnerability Classes",
                "summary": "Study native-code bugs as root-cause taxonomies rather than exploit tricks.",
                "topics": [
                    {
                        "id": "binary-memory-corruption",
                        "name": "Memory Corruption Taxonomy",
                        "summary": "Know the core bug classes that shape native-code exploitability and instability.",
                        "skills": [
                            {"id": "binary-oob", "name": "Out-of-bounds read and write", "summary": "Spatial memory safety failures and parser boundary mistakes.", "points": 12},
                            {"id": "binary-uaf-doublefree", "name": "Use-after-free and double free", "summary": "Lifetime management failures and allocator misuse.", "points": 12},
                            {"id": "binary-type-uninit", "name": "Type confusion and uninitialized memory use", "summary": "Invalid object interpretation and stale/undefined state exposure.", "points": 12},
                            {"id": "binary-int-trunc-sign", "name": "Integer overflow, truncation, and sign issues", "summary": "Arithmetic-driven corruption and trust boundary collapse.", "points": 12},
                            {"id": "binary-stack-heap-concepts", "name": "Stack and heap corruption concepts", "summary": "High-level understanding of where corruption lands and why it matters.", "points": 12},
                        ],
                    },
                    {
                        "id": "binary-logic-concurrency",
                        "name": "Logic, Lifetime, and Concurrency Faults",
                        "summary": "Learn the non-classic bug families that still generate severe impact.",
                        "skills": [
                            {"id": "binary-lifetime-ownership", "name": "Lifetime, ownership, and reference counting errors", "summary": "Ownership confusion and cleanup mistakes.", "points": 12},
                            {"id": "binary-iterators-exception-safety", "name": "Iterator invalidation and exception-safety bugs", "summary": "State corruption through partially failed execution.", "points": 12},
                            {"id": "binary-race-toctou", "name": "Race conditions and TOCTOU", "summary": "Concurrent state drift and time-of-check/time-of-use gaps.", "points": 12},
                            {"id": "binary-parser-object-layout", "name": "Parser state corruption and object layout misunderstandings", "summary": "State machines and object assumptions that fail under malformed input.", "points": 12},
                            {"id": "binary-sandbox-boundaries", "name": "Sandbox boundary weaknesses at high level", "summary": "Privilege separation and trust transitions in native systems.", "points": 12},
                        ],
                    },
                ],
            },
            {
                "id": "binary-l3",
                "name": "Level 3",
                "title": "Platform Mitigations",
                "summary": "Deeply understand what modern mitigations do, how they compose, and where they stop helping.",
                "topics": [
                    {
                        "id": "binary-memory-mitigations",
                        "name": "Memory Safety Mitigations",
                        "summary": "Study the design intent and operational limits of mainstream hardening features.",
                        "skills": [
                            {"id": "binary-aslr-dep-canary", "name": "ASLR, DEP/NX, and stack canaries", "summary": "Baseline memory corruption hardening and its assumptions.", "points": 14},
                            {"id": "binary-cfi-cet-pac", "name": "CFI families, CET, shadow stack, and PAC concepts", "summary": "Control-flow integrity and return-protection mechanisms.", "points": 14},
                            {"id": "binary-safeh-windows", "name": "SafeSEH and Windows mitigation families", "summary": "Platform-specific defenses and exploitability shaping.", "points": 14},
                            {"id": "binary-hardened-allocators", "name": "Hardened and partition allocators", "summary": "Allocator design choices that influence corruption behavior.", "points": 14},
                            {"id": "binary-mte-sanitizers", "name": "MTE and sanitizer families", "summary": "ASan, UBSan, MSan, TSan, and memory tagging concepts.", "points": 14},
                        ],
                    },
                    {
                        "id": "binary-sandbox-hardening",
                        "name": "Sandboxing and Hardening Models",
                        "summary": "Understand how isolation models constrain impact and shape research priorities.",
                        "skills": [
                            {"id": "binary-relro-flags", "name": "RELRO and compiler hardening flags", "summary": "Build-time protections and dynamic linking hardening.", "points": 14},
                            {"id": "binary-sandbox-broker", "name": "Sandboxing, broker design, and privilege separation", "summary": "Renderer/broker patterns and trust separation.", "points": 14},
                            {"id": "binary-seccomp-capability", "name": "seccomp basics and capability models", "summary": "System call mediation and privilege restriction primitives.", "points": 14},
                            {"id": "binary-jit-hardening", "name": "JIT hardening concepts", "summary": "Code generation safety and runtime hardening constraints.", "points": 14},
                        ],
                    },
                ],
            },
            {
                "id": "binary-l4",
                "name": "Level 4",
                "title": "Reverse Engineering and Debugging",
                "summary": "Build a repeatable workflow for reduction, tracing, and exploitability assessment from the defender angle.",
                "topics": [
                    {
                        "id": "binary-re-debug-method",
                        "name": "Static and Dynamic Analysis Method",
                        "summary": "Move cleanly from crash or artifact to root cause with strong evidence.",
                        "skills": [
                            {"id": "binary-static-disasm", "name": "Static disassembly and decompiler skepticism", "summary": "Read code critically and verify assumptions made by tooling.", "points": 16},
                            {"id": "binary-dynamic-tracing", "name": "Dynamic tracing and symbolic execution concepts", "summary": "Runtime inspection and path exploration for hard bugs.", "points": 16},
                            {"id": "binary-coverage-diff-debug", "name": "Coverage-guided reasoning and differential debugging", "summary": "Compare behavior across builds, inputs, and mitigations.", "points": 16},
                            {"id": "binary-crash-triage", "name": "Crash triage and root-cause reduction", "summary": "Reduce complex failures into precise bug statements.", "points": 16},
                            {"id": "binary-exploitability-defender", "name": "Exploitability assessment from a defender angle", "summary": "Classify severity and likely impact without exploit hype.", "points": 16},
                        ],
                    },
                    {
                        "id": "binary-analysis-tooling",
                        "name": "Analysis Tooling",
                        "summary": "Use visualization and instrumentation to make hard bugs easier to reason about.",
                        "skills": [
                            {"id": "binary-minimization", "name": "Minimization of crashing inputs", "summary": "Preserve causality while shrinking test cases.", "points": 16},
                            {"id": "binary-patch-diff-cfg", "name": "Patch diffing and control/data-flow reconstruction", "summary": "Understand fixes and nearby bug surfaces.", "points": 16},
                            {"id": "binary-heap-visualization", "name": "Heap visualization and emulator-assisted analysis", "summary": "See allocator state and runtime effects more clearly.", "points": 16},
                            {"id": "binary-custom-instrumentation", "name": "Custom instrumentation", "summary": "Build targeted runtime insight when stock tooling is insufficient.", "points": 16},
                        ],
                    },
                ],
            },
            {
                "id": "binary-l5",
                "name": "Level 5",
                "title": "Fuzzing and Variant Analysis",
                "summary": "Turn bug discovery into disciplined input modeling, crash management, and regression control.",
                "topics": [
                    {
                        "id": "binary-fuzzing",
                        "name": "Fuzzing Methodology",
                        "summary": "Use multiple fuzzing strategies to surface different classes of defects.",
                        "skills": [
                            {"id": "binary-grammar-coverage", "name": "Grammar-based and coverage-guided fuzzing", "summary": "Input generation strategies for parser and protocol targets.", "points": 18},
                            {"id": "binary-structure-differential-stateful", "name": "Structure-aware, differential, and stateful fuzzing", "summary": "Advanced campaign design for complex targets.", "points": 18},
                            {"id": "binary-kernel-userland-concepts", "name": "Kernel and userland fuzzing concepts", "summary": "Target modeling and harness implications across privilege layers.", "points": 18},
                            {"id": "binary-harness-corpus", "name": "Harness design and corpus curation", "summary": "Input quality, stability, and signal density.", "points": 18},
                        ],
                    },
                    {
                        "id": "binary-crash-management",
                        "name": "Crash Management and Variant Hunting",
                        "summary": "Triage at scale and extract durable engineering value from crashes.",
                        "skills": [
                            {"id": "binary-bucketing-flaky", "name": "Crash bucketing and flaky crash handling", "summary": "Separate noise from real defect families.", "points": 18},
                            {"id": "binary-dedupe-sanitizer", "name": "Deduplication and sanitizer triage", "summary": "Triage fuzz output efficiently and correctly.", "points": 18},
                            {"id": "binary-variant-regression", "name": "Variant hunting after a fix and regression tests", "summary": "Use one bug to find the family and lock in the repair.", "points": 18},
                            {"id": "binary-protocol-modeling", "name": "Protocol and parser modeling", "summary": "Understand target structure deeply enough to fuzz it well.", "points": 18},
                        ],
                    },
                ],
            },
            {
                "id": "binary-l6",
                "name": "Level 6",
                "title": "World-class Binary Research Output",
                "summary": "Publish rigorous root-cause analysis, realistic exploitability assessment, and strong mitigation guidance.",
                "topics": [
                    {
                        "id": "binary-world-class-output",
                        "name": "World-class Native-code Research",
                        "summary": "Create results that shape platform and security engineering decisions.",
                        "skills": [
                            {"id": "binary-taxonomy-papers", "name": "Root-cause taxonomy papers", "summary": "Organize bug classes in ways others can operationalize.", "points": 22},
                            {"id": "binary-variant-codebase-analysis", "name": "Variant analysis across codebases", "summary": "Find class-adjacent failures at scale after one fix.", "points": 22},
                            {"id": "binary-mitigation-evaluation", "name": "Mitigation and allocator security design evaluation", "summary": "Assess defensive design with technical rigor.", "points": 22},
                            {"id": "binary-exploitability-remediation", "name": "Reliable exploitability classification and remediation guidance", "summary": "Tell teams what matters and how to fix it.", "points": 22},
                            {"id": "binary-fuzzing-innovation", "name": "Original fuzzing and instrumentation improvements", "summary": "Advance methodology, not just individual findings.", "points": 22},
                        ],
                    }
                ],
            },
        ],
    },
    {
        "id": "malware",
        "name": "Malware Analysis",
        "icon": "☣️",
        "theme": "ruin",
        "color": "#ff5d73",
        "summary": "World-class malware analysis, defensive emulation, clustering, and durable detection engineering.",
        "levels": [
            {
                "id": "malware-l1",
                "name": "Level 1",
                "title": "Execution Environments",
                "summary": "Understand the systems and trust chains malware lives in before analyzing families.",
                "topics": [
                    {
                        "id": "malware-platform-surface",
                        "name": "Platform Execution Surface",
                        "summary": "Map where malware persists, executes, and crosses trust boundaries.",
                        "skills": [
                            {"id": "malware-os-internals", "name": "Windows, Linux, and macOS internals", "summary": "Execution, persistence, and trust-chain primitives relevant to malware.", "points": 10},
                            {"id": "malware-process-persistence", "name": "Process and persistence surface mapping", "summary": "Startup locations, services, launch agents, and task ecosystems.", "points": 10},
                            {"id": "malware-driver-kernel", "name": "Driver ecosystem and user/kernel boundary", "summary": "Privilege transitions and low-level execution contexts.", "points": 10},
                            {"id": "malware-api-trust-signing", "name": "Abused API surfaces and signing trust chains", "summary": "Common system APIs and code-signing assumptions used by malware.", "points": 10},
                            {"id": "malware-sandbox-isolation", "name": "Sandboxing and app isolation models", "summary": "How containment changes malware behavior and visibility.", "points": 10},
                        ],
                    }
                ],
            },
            {
                "id": "malware-l2",
                "name": "Level 2",
                "title": "Malware Analysis Foundations",
                "summary": "Build strong static, dynamic, and reverse-engineering workflows for repeated family analysis.",
                "topics": [
                    {
                        "id": "malware-static-analysis",
                        "name": "Static Analysis",
                        "summary": "Extract high-value information safely before detonation.",
                        "skills": [
                            {"id": "malware-pe-elf-macho", "name": "PE, ELF, and Mach-O parsing", "summary": "Executable format internals for capability and loader analysis.", "points": 12},
                            {"id": "malware-imports-resources", "name": "Imports, exports, resources, and relocations", "summary": "Behavior hints from structural metadata.", "points": 12},
                            {"id": "malware-packers-config", "name": "Packer recognition and config extraction", "summary": "Identify packing and recover operational configuration.", "points": 12},
                            {"id": "malware-strings-obfuscation", "name": "Strings limits and obfuscation patterns", "summary": "Avoid over-trusting strings while recognizing common concealment.", "points": 12},
                            {"id": "malware-anti-analysis-indicators", "name": "Anti-analysis indicator recognition", "summary": "Spot signs that the sample behaves differently under scrutiny.", "points": 12},
                        ],
                    },
                    {
                        "id": "malware-dynamic-analysis",
                        "name": "Dynamic Analysis",
                        "summary": "Observe behavior safely and preserve artifacts for later pivots.",
                        "skills": [
                            {"id": "malware-safe-lab", "name": "Safe lab design and controlled detonation", "summary": "Isolated execution and observation discipline.", "points": 12},
                            {"id": "malware-behavior-logging", "name": "Behavioral logging and process tree inspection", "summary": "Collect execution traces and process relationships.", "points": 12},
                            {"id": "malware-artifact-collection", "name": "File, registry, service, task, and mutex artifact collection", "summary": "Persist and correlate all useful runtime traces.", "points": 12},
                            {"id": "malware-memory-api-tracing", "name": "Memory artifact observation and API tracing concepts", "summary": "See runtime-only behaviors that static inspection misses.", "points": 12},
                            {"id": "malware-sandbox-interpretation", "name": "Sandbox artifact interpretation", "summary": "Understand what automated analysis does and does not prove.", "points": 12},
                        ],
                    },
                    {
                        "id": "malware-reverse-engineering",
                        "name": "Reverse Engineering Workflow",
                        "summary": "Turn complex code into capability, config, and protocol understanding.",
                        "skills": [
                            {"id": "malware-decompiler-cleanup", "name": "Decompiler cleanup and function naming methodology", "summary": "Impose structure on unfamiliar malware codebases.", "points": 12},
                            {"id": "malware-controlflow-crypto", "name": "Control-flow untangling and custom crypto recognition", "summary": "Recover logic from intentionally obscured binaries.", "points": 12},
                            {"id": "malware-config-protocol", "name": "Config decoding and protocol reconstruction", "summary": "Recover C2 schemas and operational details.", "points": 12},
                            {"id": "malware-dispatcher-persistence", "name": "Command dispatcher and persistence logic tracing", "summary": "Map what the malware can do and when it does it.", "points": 12},
                            {"id": "malware-capability-mapping", "name": "Capability mapping", "summary": "Translate code understanding into defensible capability statements.", "points": 12},
                        ],
                    },
                ],
            },
            {
                "id": "malware-l3",
                "name": "Level 3",
                "title": "Malware Tradecraft Taxonomy",
                "summary": "Classify families and payload styles without turning the roadmap into a malware-building manual.",
                "topics": [
                    {
                        "id": "malware-family-taxonomy",
                        "name": "Family and Tradecraft Taxonomy",
                        "summary": "Recognize the operational purpose and architecture of common malware categories.",
                        "skills": [
                            {"id": "malware-droppers-loaders", "name": "Droppers, loaders, and downloaders", "summary": "Stage-setting malware and delivery architecture at a conceptual level.", "points": 14},
                            {"id": "malware-rats-stealers", "name": "RATs and stealers", "summary": "Interactive control and credential/data theft categories.", "points": 14},
                            {"id": "malware-ransom-bot-worm", "name": "Ransomware, botnets, and worm propagation models", "summary": "Operational goals and spread mechanics at a high level.", "points": 14},
                            {"id": "malware-wipers-rootkits-boot", "name": "Wipers, rootkit concepts, and boot-level threats", "summary": "Destructive and stealth-oriented malware categories.", "points": 14},
                            {"id": "malware-mobile-cloud-lol", "name": "Mobile, cloud, and LOL payload staging patterns", "summary": "Modern malware categories beyond classic desktop binaries.", "points": 14},
                        ],
                    }
                ],
            },
            {
                "id": "malware-l4",
                "name": "Level 4",
                "title": "Evasion and Anti-analysis Understanding",
                "summary": "Understand evasion classes so you can recognize and neutralize them in analysis and detection.",
                "topics": [
                    {
                        "id": "malware-evasion-taxonomy",
                        "name": "Evasion Taxonomy",
                        "summary": "Treat evasion as a family of analysis denial patterns, not a bag of tricks.",
                        "skills": [
                            {"id": "malware-packing-virtualization", "name": "Packing and virtualization obfuscation concepts", "summary": "Structural concealment and execution indirection.", "points": 16},
                            {"id": "malware-anti-debug-vm", "name": "Anti-debug and anti-VM classes", "summary": "Environment checks and analyst disruption patterns.", "points": 16},
                            {"id": "malware-timing-environment-keying", "name": "Timing checks and environmental keying", "summary": "Conditional behavior keyed to environment properties.", "points": 16},
                            {"id": "malware-api-hashing-staging", "name": "API hashing and staged payload design patterns", "summary": "Late-binding and concealment concepts in malware behavior.", "points": 16},
                            {"id": "malware-dead-drop-encrypted-config", "name": "Dead-drop C2 and encrypted config/storage patterns", "summary": "Resilient communication and hidden state strategies.", "points": 16},
                        ],
                    }
                ],
            },
            {
                "id": "malware-l5",
                "name": "Level 5",
                "title": "Threat Intel and Clustering",
                "summary": "Move from single-sample analysis to family, campaign, and infrastructure understanding with disciplined confidence.",
                "topics": [
                    {
                        "id": "malware-clustering",
                        "name": "Clustering and Attribution Discipline",
                        "summary": "Cluster families and campaigns without overclaiming actor attribution.",
                        "skills": [
                            {"id": "malware-family-clustering", "name": "Family clustering methodology", "summary": "Group samples by durable technical characteristics.", "points": 18},
                            {"id": "malware-code-infra-config", "name": "Code reuse, infrastructure, and config schema comparison", "summary": "Connect related samples and campaigns with evidence.", "points": 18},
                            {"id": "malware-attck-yara", "name": "ATT&CK mapping and YARA thinking", "summary": "Operationalize findings into shared language and durable detections.", "points": 18},
                            {"id": "malware-attribution-rigor", "name": "False attribution risks and actor-vs-tool separation", "summary": "Keep confidence language clean and claims evidence-based.", "points": 18},
                            {"id": "malware-reporting-rigor", "name": "Reporting rigor", "summary": "Produce intel outputs that survive scrutiny.", "points": 18},
                        ],
                    }
                ],
            },
            {
                "id": "malware-l6",
                "name": "Level 6",
                "title": "World-class Malware Analyst Output",
                "summary": "Produce extractors, deobfuscators, family lineage work, and durable detections from deep technical understanding.",
                "topics": [
                    {
                        "id": "malware-world-class-output",
                        "name": "World-class Malware Analysis Deliverables",
                        "summary": "Create tooling and reporting that scales beyond one sample.",
                        "skills": [
                            {"id": "malware-config-extractors", "name": "Config extractors", "summary": "Automate recovery of operational malware configuration.", "points": 20},
                            {"id": "malware-unpackers", "name": "Unpackers and deobfuscators", "summary": "Make repeated analysis of packed families more efficient.", "points": 20},
                            {"id": "malware-lineage-mapping", "name": "Family lineage mapping", "summary": "Track how tools and campaigns evolve over time.", "points": 20},
                            {"id": "malware-fused-analysis", "name": "Memory, static, and network fused analysis", "summary": "Use all evidence sources together instead of in isolation.", "points": 20},
                            {"id": "malware-durable-detections", "name": "Durable detections and evidence-based reporting", "summary": "Translate family knowledge into repeatable defensive value.", "points": 20},
                        ],
                    }
                ],
            },
        ],
    },
    {
        "id": "ai",
        "name": "AI Security",
        "icon": "🧬",
        "theme": "arcane",
        "color": "#d7a2ff",
        "summary": "Model behavior, system architecture, secure tooling boundaries, and rigorous red-team evaluation for AI systems.",
        "levels": [
            {
                "id": "ai-l1",
                "name": "Level 1",
                "title": "AI / ML Substrate",
                "summary": "Understand the math, model architecture, and serving substrate behind modern AI systems.",
                "topics": [
                    {
                        "id": "ai-ml-foundations",
                        "name": "ML Foundations",
                        "summary": "Build the fundamentals needed to reason about model behavior and system tradeoffs.",
                        "skills": [
                            {"id": "ai-math-core", "name": "Linear algebra, optimization, probability, and statistics", "summary": "The mathematical substrate of modern machine learning.", "points": 10},
                            {"id": "ai-information-theory", "name": "Information theory basics", "summary": "Reasoning about compression, entropy, and representation.", "points": 10},
                            {"id": "ai-neural-basics", "name": "Neural network fundamentals", "summary": "Core learning dynamics and representation building.", "points": 10},
                            {"id": "ai-transformers", "name": "Transformers deeply", "summary": "Attention, sequence modeling, and why transformers dominate modern systems.", "points": 10},
                            {"id": "ai-tokenization-embeddings", "name": "Tokenization and embeddings", "summary": "Representation boundaries that strongly affect prompt and retrieval behavior.", "points": 10},
                        ],
                    },
                    {
                        "id": "ai-training-serving",
                        "name": "Training and Serving Pipeline",
                        "summary": "Understand how models are trained, adapted, and deployed in production.",
                        "skills": [
                            {"id": "ai-training-loops", "name": "Training loops, loss functions, and regularization", "summary": "What shapes model behavior before deployment.", "points": 10},
                            {"id": "ai-finetuning-rlhf", "name": "Fine-tuning and RLHF/RLAIF concepts", "summary": "Post-training behavior shaping and reward design.", "points": 10},
                            {"id": "ai-inference-stack", "name": "Inference stacks, quantization, and distillation", "summary": "Production model delivery and efficiency tradeoffs.", "points": 10},
                            {"id": "ai-rag-agents", "name": "Vector databases, RAG, and tool/agent architecture", "summary": "Retrieval and action layers wrapped around models.", "points": 10},
                            {"id": "ai-evals-benchmarks", "name": "Evals and benchmarks", "summary": "Behavior measurement and why naive benchmarks mislead.", "points": 10},
                        ],
                    },
                ],
            },
            {
                "id": "ai-l2",
                "name": "Level 2",
                "title": "Secure ML Systems Thinking",
                "summary": "Map trust boundaries across training, retrieval, memory, tools, integrations, and multi-tenant inference.",
                "topics": [
                    {
                        "id": "ai-system-boundaries",
                        "name": "Model and Product Boundaries",
                        "summary": "Learn how security risk emerges between components, not just inside the model.",
                        "skills": [
                            {"id": "ai-supply-chain", "name": "Model supply chain and artifact integrity", "summary": "Model provenance, checkpoints, and build trust.", "points": 12},
                            {"id": "ai-training-inference-split", "name": "Training and inference separation", "summary": "Boundary discipline across data and model lifecycle stages.", "points": 12},
                            {"id": "ai-feature-prompt-retrieval", "name": "Feature pipelines, prompt construction, and retrieval path", "summary": "Where user input and hidden state shape model behavior.", "points": 12},
                            {"id": "ai-memory-tools-secrets", "name": "Memory handling, tool invocation, and secret exposure surfaces", "summary": "Statefulness and actuation as core security risk multipliers.", "points": 12},
                            {"id": "ai-integrations-multitenant", "name": "Integration trust boundaries and multi-tenant inference concerns", "summary": "User-to-model-to-tool transitions and tenant isolation.", "points": 12},
                            {"id": "ai-gpu-deployment-hardening", "name": "Deployment hardening and GPU isolation basics", "summary": "Operational controls around model hosting and inference infrastructure.", "points": 12},
                        ],
                    }
                ],
            },
            {
                "id": "ai-l3",
                "name": "Level 3",
                "title": "Threat Classes",
                "summary": "Study model misuse, system abuse, privacy exposure, and integrity failures at a systems level.",
                "topics": [
                    {
                        "id": "ai-behavior-misuse",
                        "name": "Model Behavior and Misuse",
                        "summary": "Reason about the many ways instruction handling and tool orchestration fail.",
                        "skills": [
                            {"id": "ai-prompt-injection", "name": "Prompt and indirect prompt injection", "summary": "Instruction hierarchy abuse through direct and indirect channels.", "points": 14},
                            {"id": "ai-context-retrieval-poisoning", "name": "Context and retrieval poisoning", "summary": "Corrupt memory, retrieval, or context to change behavior.", "points": 14},
                            {"id": "ai-tool-exfil-agency", "name": "Tool misuse, exfiltration, and excessive agency", "summary": "Abuse of model-connected tools and action surfaces.", "points": 14},
                            {"id": "ai-jailbreak-role-confusion", "name": "Jailbreaks, policy evasion, and role confusion", "summary": "Undermine control layers and prompt hierarchy.", "points": 14},
                            {"id": "ai-multimodal-hidden-schema", "name": "Multimodal injection and output schema abuse", "summary": "Non-text inputs and structured output channels as attack surfaces.", "points": 14},
                            {"id": "ai-hallucination-security", "name": "Hallucination as a security dependency risk", "summary": "Understand when bad model outputs become product security flaws.", "points": 14},
                        ],
                    },
                    {
                        "id": "ai-privacy-integrity-availability",
                        "name": "Privacy, Integrity, and Availability",
                        "summary": "Treat model systems as data-dependent software with unique leakage and integrity risks.",
                        "skills": [
                            {"id": "ai-inversion-memorization", "name": "Model inversion, memorization, and data leakage", "summary": "Privacy leakage through model behavior and retained data.", "points": 14},
                            {"id": "ai-model-theft-extraction", "name": "Model theft and extraction risk", "summary": "Weight, behavior, and interface replication concerns.", "points": 14},
                            {"id": "ai-poisoning-backdoor", "name": "Data poisoning and backdoor concepts", "summary": "Training integrity failures and latent malicious behavior.", "points": 14},
                            {"id": "ai-adversarial-evasion", "name": "Adversarial examples and evasion concepts", "summary": "Input manipulations that alter inference outcomes.", "points": 14},
                            {"id": "ai-eval-gaming-reward", "name": "Eval gaming and unsafe reward shaping", "summary": "Measurement failures that hide unsafe behavior.", "points": 14},
                            {"id": "ai-resource-cache-loops", "name": "Autonomous loops, denial-of-wallet, and prompt cache poisoning", "summary": "Availability and cost-abuse risk in agentic systems.", "points": 14},
                        ],
                    },
                ],
            },
            {
                "id": "ai-l4",
                "name": "Level 4",
                "title": "AI Red-team Methodology",
                "summary": "Design rigorous, safe, authorized evaluations that separate anecdotes from systemic flaws.",
                "topics": [
                    {
                        "id": "ai-redteam-method",
                        "name": "Red-team Method",
                        "summary": "Approach AI evaluation like real research, not demo-chasing.",
                        "skills": [
                            {"id": "ai-threat-model-precise", "name": "Define the threat model precisely", "summary": "Make assumptions, assets, actors, and trust boundaries explicit.", "points": 16},
                            {"id": "ai-model-vs-product", "name": "Separate product flaws from model behavior", "summary": "Attribute failures to the right layer.", "points": 16},
                            {"id": "ai-attack-trees", "name": "Attack trees for agentic systems", "summary": "Model failure chains across prompts, tools, memory, and integrations.", "points": 16},
                            {"id": "ai-boundary-tests", "name": "Instruction hierarchy and retrieval/tool boundary tests", "summary": "Stress the exact trust transitions that matter.", "points": 16},
                            {"id": "ai-eval-coverage", "name": "Coverage-oriented eval set design", "summary": "Build test sets that reveal systematic weakness.", "points": 16},
                            {"id": "ai-repro-regression", "name": "Reproducibility, false-claim minimization, and regression suites", "summary": "Separate weirdness from real issues and keep fixes durable.", "points": 16},
                        ],
                    }
                ],
            },
            {
                "id": "ai-l5",
                "name": "Level 5",
                "title": "Defenses",
                "summary": "Build layered defenses around tool use, memory, retrieval, output handling, and operational governance.",
                "topics": [
                    {
                        "id": "ai-defensive-architecture",
                        "name": "Secure Agent and ML System Design",
                        "summary": "Design secure AI systems with clear capability and trust controls.",
                        "skills": [
                            {"id": "ai-prompt-compartmentalization", "name": "Prompt compartmentalization and least-privilege tool design", "summary": "Reduce control bleed and tool overreach.", "points": 18},
                            {"id": "ai-capability-sandbox", "name": "Capability scoping and execution sandboxes", "summary": "Limit blast radius when models act.", "points": 18},
                            {"id": "ai-retrieval-provenance", "name": "Retrieval trust scoring and provenance controls", "summary": "Treat retrieved data as untrusted until proven otherwise.", "points": 18},
                            {"id": "ai-output-schema-hitl", "name": "Output validation, schema enforcement, and HITL checkpoints", "summary": "Keep the model from directly driving unsafe outcomes.", "points": 18},
                            {"id": "ai-memory-secret-logging", "name": "Memory isolation, secret redaction, and secure logging", "summary": "Protect long-lived state and sensitive data surfaces.", "points": 18},
                            {"id": "ai-monitoring-killswitch", "name": "Behavior monitoring, rollback, and kill-switch design", "summary": "Contain unsafe drift operationally.", "points": 18},
                        ],
                    }
                ],
            },
            {
                "id": "ai-l6",
                "name": "Level 6",
                "title": "World-class AI Security Output",
                "summary": "Produce rigorous evaluation frameworks, architecture patterns, and evidence-based claims that stand up to scrutiny.",
                "topics": [
                    {
                        "id": "ai-world-class-output",
                        "name": "World-class AI Security Research",
                        "summary": "Ship methodology and architecture guidance, not just jailbreak screenshots.",
                        "skills": [
                            {"id": "ai-eval-frameworks", "name": "Robust evaluation frameworks", "summary": "Build reusable evaluation infrastructure for AI security testing.", "points": 20},
                            {"id": "ai-redteam-reports", "name": "Red-team reports with clean methodology", "summary": "Make claims that are measurable, reproducible, and scoped.", "points": 20},
                            {"id": "ai-tool-boundary-research", "name": "Tool-agent boundary research", "summary": "Explain failure modes where AI meets external action.", "points": 20},
                            {"id": "ai-indirect-injection-data-leakage", "name": "Indirect injection and data leakage studies", "summary": "Treat retrieval and memory as research-worthy attack surfaces.", "points": 20},
                            {"id": "ai-safe-agent-patterns", "name": "Secure agent architecture patterns and safety regression suites", "summary": "Translate research into implementation guidance teams can use.", "points": 20},
                        ],
                    }
                ],
            },
        ],
    },
    {
        "id": "forensics",
        "name": "Digital Forensics",
        "icon": "🧾",
        "theme": "shadow",
        "color": "#ffe071",
        "summary": "Evidence science, system internals, timeline reconstruction, and expert-grade reporting discipline.",
        "levels": [
            {
                "id": "forensics-l1",
                "name": "Level 1",
                "title": "Forensic Principles",
                "summary": "Get evidence handling, integrity, scope control, and repeatability right before deeper artifact work.",
                "topics": [
                    {
                        "id": "forensics-core-principles",
                        "name": "Core Principles",
                        "summary": "Establish evidence discipline that survives technical and legal scrutiny.",
                        "skills": [
                            {"id": "for-order-volatility", "name": "Order of volatility", "summary": "Know what evidence disappears first and how to prioritize collection.", "points": 10},
                            {"id": "for-chain-integrity", "name": "Chain of custody and evidence integrity", "summary": "Track evidence movement and protect trust in your collection.", "points": 10},
                            {"id": "for-hashing-repeatability", "name": "Hashing, verification, and repeatability", "summary": "Verify integrity and ensure work can be repeated.", "points": 10},
                            {"id": "for-contamination-provenance", "name": "Contamination avoidance and provenance", "summary": "Prevent your own process from corrupting the evidence story.", "points": 10},
                            {"id": "for-scope-doc-constraints", "name": "Documentation, scope control, and legal constraints", "summary": "Record exactly what was done and stay inside authorized boundaries.", "points": 10},
                        ],
                    }
                ],
            },
            {
                "id": "forensics-l2",
                "name": "Level 2",
                "title": "Storage and Filesystem Internals",
                "summary": "Understand how data persists, mutates, and disappears on modern storage systems.",
                "topics": [
                    {
                        "id": "forensics-storage-structures",
                        "name": "Disk and Partition Structures",
                        "summary": "Know where evidence lives before you inspect higher-level artifacts.",
                        "skills": [
                            {"id": "for-disks-mbr-gpt", "name": "Disks, partitions, MBR, and GPT", "summary": "Storage layout primitives and why they matter in exams.", "points": 12},
                            {"id": "for-filesystem-metadata", "name": "Filesystem metadata and journaling concepts", "summary": "Metadata persistence and filesystem recovery clues.", "points": 12},
                            {"id": "for-ntfs-ext-apfs", "name": "NTFS, ext family, and APFS basics", "summary": "Core filesystems and their security-relevant artifacts.", "points": 12},
                            {"id": "for-fat-slack-deleted", "name": "FAT legacy relevance, slack space, and deleted-file recovery concepts", "summary": "Legacy media and residual artifact understanding.", "points": 12},
                            {"id": "for-timezone-ads-vss", "name": "Timestamp semantics, ADS, and volume shadow copies", "summary": "Time normalization and hidden/alternate artifact locations.", "points": 12},
                            {"id": "for-encryption-cloudsync", "name": "Encryption artifacts and cloud sync side effects", "summary": "Persisted keys, metadata, and sync-induced artifact changes.", "points": 12},
                        ],
                    }
                ],
            },
            {
                "id": "forensics-l3",
                "name": "Level 3",
                "title": "Host Artifact Mastery",
                "summary": "Build broad, precise familiarity with host, mobile, and cloud artifact ecosystems.",
                "topics": [
                    {
                        "id": "forensics-windows-artifacts",
                        "name": "Windows Artifact Mastery",
                        "summary": "Know the common Windows artifact families and how they relate to execution and persistence.",
                        "skills": [
                            {"id": "for-registry-hives-shell", "name": "Registry, user hives, and shell artifacts", "summary": "Persistent user and system state on Windows hosts.", "points": 14},
                            {"id": "for-prefetch-eventlogs", "name": "Prefetch, event logs, and app execution traces", "summary": "Execution and activity reconstruction on Windows.", "points": 14},
                            {"id": "for-jumplist-srum-shimcache-amcache", "name": "Jump Lists, SRUM, Shimcache, and Amcache awareness", "summary": "Common high-value Windows evidence sources.", "points": 14},
                            {"id": "for-browser-rdp-usb", "name": "Browser, RDP, and USB artifacts", "summary": "User activity, remote access, and removable media traces.", "points": 14},
                            {"id": "for-task-wmi-powershell-defender", "name": "Task, WMI, PowerShell, and Defender artifacts", "summary": "Execution, persistence, and defensive telemetry intersections.", "points": 14},
                        ],
                    },
                    {
                        "id": "forensics-linux-macos-artifacts",
                        "name": "Linux and macOS Artifact Mastery",
                        "summary": "Understand Unix-like host artifacts and their caveats.",
                        "skills": [
                            {"id": "for-shell-auth-service", "name": "Shell history, auth logs, and systemd/service artifacts", "summary": "Execution traces and their limitations on Linux.", "points": 14},
                            {"id": "for-cron-launchd-packages", "name": "cron, launchd, and package manager traces", "summary": "Persistence and software provenance clues.", "points": 14},
                            {"id": "for-ssh-browser-app-plist", "name": "SSH, browser/app traces, and plist/unified log concepts", "summary": "User activity and operational artifacts on Unix-like systems.", "points": 14},
                            {"id": "for-container-cloud-agent", "name": "Container and cloud agent traces", "summary": "Modern workload telemetry from hosts.", "points": 14},
                        ],
                    },
                    {
                        "id": "forensics-mobile-cloud-artifacts",
                        "name": "Mobile and Cloud Artifacts",
                        "summary": "Track evidence in mobile platforms and cloud-native environments.",
                        "skills": [
                            {"id": "for-ios-android", "name": "iOS and Android artifact categories", "summary": "Mobile app, device, and backup artifact families.", "points": 14},
                            {"id": "for-app-sandbox-backup", "name": "App sandbox and backup artifacts", "summary": "What survives, where, and under what access conditions.", "points": 14},
                            {"id": "for-cloud-audit-saas", "name": "Cloud audit trails and SaaS activity evidence", "summary": "Control plane and SaaS artifact sources.", "points": 14},
                            {"id": "for-object-storage-identity", "name": "Object storage and identity provider logs", "summary": "Cloud-side evidence for access and data movement.", "points": 14},
                        ],
                    },
                ],
            },
            {
                "id": "forensics-l4",
                "name": "Level 4",
                "title": "Memory Forensics",
                "summary": "Fuse volatile evidence with host and network artifacts to understand runtime-only behavior.",
                "topics": [
                    {
                        "id": "forensics-memory-analysis",
                        "name": "Memory Evidence Analysis",
                        "summary": "Use volatile artifacts to explain execution, concealment, and runtime state.",
                        "skills": [
                            {"id": "for-proc-module-anomalies", "name": "Process and module anomaly concepts", "summary": "Runtime enumeration and what hidden or unexpected state implies.", "points": 16},
                            {"id": "for-injected-region-awareness", "name": "Injected region and code injection awareness", "summary": "Memory-resident execution and suspicious region mapping.", "points": 16},
                            {"id": "for-handle-object-credentials", "name": "Handle inspection and credential material awareness", "summary": "High-level volatile evidence sources and their limits.", "points": 16},
                            {"id": "for-network-socket-memory", "name": "Network and socket reconstruction", "summary": "Volatile communications evidence correlated with other traces.", "points": 16},
                            {"id": "for-memory-disk-fusion", "name": "Timeline fusion between disk and memory", "summary": "Use volatile and persistent artifacts as one narrative.", "points": 16},
                        ],
                    }
                ],
            },
            {
                "id": "forensics-l5",
                "name": "Level 5",
                "title": "Timeline and Attribution Discipline",
                "summary": "Build defensible incident narratives with precise confidence language and explicit uncertainty.",
                "topics": [
                    {
                        "id": "forensics-timeline-discipline",
                        "name": "Timeline Reconstruction Discipline",
                        "summary": "Reconstruct events without overstating what the evidence proves.",
                        "skills": [
                            {"id": "for-super-timeline", "name": "Super-timeline building and timestamp normalization", "summary": "Correlate many artifact streams into a coherent chronology.", "points": 18},
                            {"id": "for-clock-skew-antiforensics", "name": "Clock skew and anti-forensics awareness", "summary": "Know when time lies and logs were manipulated.", "points": 18},
                            {"id": "for-user-vs-system-remote-local", "name": "User-vs-system and remote-vs-local inference", "summary": "Differentiate action sources with appropriate caution.", "points": 18},
                            {"id": "for-persistence-lateral-exfil", "name": "Persistence, lateral movement, and exfiltration reconstruction", "summary": "Tie disparate evidence to operational attacker activity.", "points": 18},
                            {"id": "for-confidence-alt-hypothesis", "name": "Confidence language and alternative explanation testing", "summary": "State what you know, what you infer, and what could also explain it.", "points": 18},
                        ],
                    }
                ],
            },
            {
                "id": "forensics-l6",
                "name": "Level 6",
                "title": "World-class Forensic Output",
                "summary": "Deliver defensible narratives, clear limitations, and reproducible methodology fit for expert scrutiny.",
                "topics": [
                    {
                        "id": "forensics-world-class-output",
                        "name": "World-class Forensic Deliverables",
                        "summary": "Produce reports and timelines that remain strong under legal and technical pressure.",
                        "skills": [
                            {"id": "for-defensible-timelines", "name": "Defensible timelines", "summary": "Build incident chronologies that are precise and evidence-backed.", "points": 20},
                            {"id": "for-artifact-fusion", "name": "Artifact fusion across sources", "summary": "Blend host, identity, cloud, and memory signal into one narrative.", "points": 20},
                            {"id": "for-antiforensics-recognition", "name": "Anti-forensics recognition", "summary": "Notice when evidence is missing or manipulated for a reason.", "points": 20},
                            {"id": "for-restrained-conclusions", "name": "Precise, restrained conclusions", "summary": "Avoid overclaiming and state uncertainty clearly.", "points": 20},
                            {"id": "for-repro-reports", "name": "Reproducible methodology and expert-quality reporting", "summary": "Document work so another examiner can follow and defend it.", "points": 20},
                        ],
                    }
                ],
            },
        ],
    },
]


def iter_leaf_skills():
    for specialization in SPECIALIZATIONS:
        for level in specialization["levels"]:
            for topic in level["topics"]:
                for skill in topic["skills"]:
                    yield specialization, level, topic, skill


SPECIALIZATION_INDEX = {item["id"]: item for item in SPECIALIZATIONS}
SKILL_INDEX = {
    skill["id"]: {
        **skill,
        "specialization_id": specialization["id"],
        "specialization_name": specialization["name"],
        "specialization_icon": specialization["icon"],
        "level_id": level["id"],
        "level_name": level["name"],
        "level_title": level["title"],
        "topic_id": topic["id"],
        "topic_name": topic["name"],
    }
    for specialization, level, topic, skill in iter_leaf_skills()
}
