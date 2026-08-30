-- =========================================
-- ENTERPRISE DECISION INTELLIGENCE PLATFORM
-- SAMPLE DATA
-- =========================================


-- =========================================
-- SAMPLE ENTITIES
-- =========================================

INSERT INTO entities
(
    name,
    type,
    description
)

VALUES

(
    'Sales Department',
    'Department',
    'Handles enterprise sales operations and customer growth'
),

(
    'AI Analytics System',
    'System',
    'Processes enterprise data and generates decision intelligence'
),

(
    'Digital Transformation Project',
    'Project',
    'Improves enterprise operations through digital technologies'
),

(
    'Marketing Department',
    'Department',
    'Handles marketing campaigns and customer engagement'
),

(
    'Customer Database',
    'System',
    'Stores customer information and enterprise interaction data'
),

(
    'Business Intelligence Team',
    'Department',
    'Analyzes enterprise data and prepares business insights'
);



-- =========================================
-- SAMPLE RELATIONSHIPS
-- =========================================

INSERT INTO relationships
(
    source_entity,
    relationship_type,
    target_entity,
    strength
)

VALUES

(
    'Sales Department',
    'Uses',
    'AI Analytics System',
    'High'
),

(
    'Digital Transformation Project',
    'Depends On',
    'AI Analytics System',
    'High'
),

(
    'Sales Department',
    'Impacts',
    'Digital Transformation Project',
    'Medium'
),

(
    'Marketing Department',
    'Uses',
    'Customer Database',
    'High'
),

(
    'Business Intelligence Team',
    'Uses',
    'AI Analytics System',
    'Medium'
),

(
    'AI Analytics System',
    'Connected To',
    'Customer Database',
    'Medium'
);