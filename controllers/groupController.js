const { getContainer } = require('../db');
const { v4: uuidv4 } = require('uuid');

/**
 * Get or create a study group for a specific note/summary.
 */
exports.createGroup = async (req, res) => {
    try {
        const { name, summaryId } = req.body;
        const studentId = req.user.uid || req.user.email;

        if (!summaryId) {
            return res.status(400).json({ error: 'Summary ID is required for collaboration.' });
        }

        const container = getContainer();
        if (!container) {
            return res.status(500).json({ error: 'Database not initialized.' });
        }

        // 1. Check if a group already exists for this summaryId
        const { resources: existingGroups } = await container.items.query({
            query: "SELECT * FROM c WHERE c.type = 'group' AND c.summaryId = @summaryId",
            parameters: [{ name: "@summaryId", value: summaryId }]
        }).fetchAll();

        if (existingGroups.length > 0) {
            const group = existingGroups[0];
            // Ensure student is a member
            if (!group.members.includes(studentId)) {
                group.members.push(studentId);
                // REFINED FIX: Use undefined for partition key if studentId is missing (legacy docs)
                // In Cosmos DB, if a doc was created without the PK field, it lives in the "Undefined" partition.
                const partitionKey = (group.studentId !== undefined && group.studentId !== null) ? group.studentId : undefined;
                await container.item(group.id, partitionKey).replace(group);
            }
            return res.status(201).json({ // Return 201 for frontend compatibility
                success: true,
                message: 'Joined existing collaboration session.',
                group: group
            });
        }

        // 2. Create new group if it doesn't exist
        const inviteCode = uuidv4().substring(0, 8).toUpperCase();

        const groupDoc = {
            id: `group_${Date.now()}`,
            type: 'group',
            name: name || 'Collaborative Session',
            studentId: studentId, // Required partition key for current container config
            createdBy: studentId,
            members: [studentId],
            summaryId: summaryId,
            inviteCode: inviteCode,
            createdAt: new Date().toISOString()
        };

        await container.items.create(groupDoc);

        return res.status(201).json({
            success: true,
            message: 'Collaboration session started.',
            group: groupDoc
        });

    } catch (error) {
        console.error("Create group error:", error.message);
        return res.status(500).json({ error: 'Internal server error during group creation.' });
    }
};

/**
 * Join a group using an invite code.
 */
exports.joinGroup = async (req, res) => {
    try {
        const { inviteCode } = req.body;
        const studentId = req.user.uid || req.user.email;

        if (!inviteCode) {
            return res.status(400).json({ error: 'Invite code is required.' });
        }

        const container = getContainer();
        if (!container) {
            return res.status(500).json({ error: 'Database not initialized.' });
        }

        // Find group by invite code
        const { resources: groups } = await container.items.query({
            query: "SELECT * FROM c WHERE c.type = 'group' AND c.inviteCode = @code",
            parameters: [{ name: "@code", value: inviteCode.toUpperCase() }]
        }).fetchAll();

        if (groups.length === 0) {
            return res.status(404).json({ error: 'Invalid invite code.' });
        }

        const group = groups[0];

        // Check if user is already a member
        if (group.members.includes(studentId)) {
            return res.status(200).json({
                success: true,
                message: 'You are already a member of this group.',
                group: group
            });
        }

        // Add user to members
        group.members.push(studentId);

        // REFINED FIX: Use undefined for partition key if studentId is missing (legacy docs)
        const partitionKey = (group.studentId !== undefined && group.studentId !== null) ? group.studentId : undefined;
        await container.item(group.id, partitionKey).replace(group);

        return res.status(200).json({
            success: true,
            message: 'Joined group successfully.',
            group: group
        });

    } catch (error) {
        console.error("Join group error:", error.message);
        return res.status(500).json({ error: 'Internal server error during group joining.' });
    }
};

/**
 * List all groups for the current user.
 */
exports.getGroups = async (req, res) => {
    try {
        const studentId = req.user.uid || req.user.email;
        const container = getContainer();

        if (!container) {
            return res.status(500).json({ error: 'Database not initialized.' });
        }

        const { resources: groups } = await container.items.query({
            query: "SELECT * FROM c WHERE c.type = 'group' AND ARRAY_CONTAINS(c.members, @id)",
            parameters: [{ name: "@id", value: studentId }]
        }).fetchAll();

        return res.status(200).json({
            success: true,
            groups: groups
        });

    } catch (error) {
        console.error("Get groups error:", error.message);
        return res.status(500).json({ error: 'Internal server error during fetching groups.' });
    }
};
