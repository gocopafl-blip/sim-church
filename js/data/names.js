/**
 * Sim Church - Name Generation Data
 * Random first and last names for staff candidates
 */

window.SimChurch = window.SimChurch || {};
window.SimChurch.Data = window.SimChurch.Data || {};

window.SimChurch.Data.Names = {
    firstNames: [
        // Male names
        'James', 'John', 'Robert', 'Michael', 'David', 'William', 'Richard', 'Joseph',
        'Thomas', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Steven',
        'Paul', 'Andrew', 'Joshua', 'Kenneth', 'Kevin', 'Brian', 'Timothy', 'Ronald',
        'Edward', 'Jason', 'Jeffrey', 'Ryan', 'Jacob', 'Gary', 'Nicholas',
        // Female names
        'Mary', 'Patricia', 'Jennifer', 'Linda', 'Sarah', 'Elizabeth', 'Barbara',
        'Susan', 'Jessica', 'Karen', 'Nancy', 'Lisa', 'Betty', 'Margaret', 'Sandra',
        'Ashley', 'Dorothy', 'Kimberly', 'Emily', 'Donna', 'Michelle', 'Carol',
        'Amanda', 'Melissa', 'Deborah', 'Stephanie', 'Rebecca', 'Sharon', 'Laura',
        'Rachel', 'Carolyn', 'Janet', 'Catherine', 'Maria', 'Heather', 'Diane',
        'Ruth', 'Julie', 'Olivia', 'Joyce', 'Virginia', 'Victoria', 'Grace', 'Joan'
    ],

    lastNames: [
        'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
        'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
        'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
        'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
        'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen',
        'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera',
        'Campbell', 'Mitchell', 'Carter', 'Roberts', 'Chen', 'Kim', 'Park', 'Patel'
    ],

    /**
     * Generate a random full name
     * @returns {string} Random full name
     */
    generateName: function () {
        const first = this.firstNames[Math.floor(Math.random() * this.firstNames.length)];
        const last = this.lastNames[Math.floor(Math.random() * this.lastNames.length)];
        return `${first} ${last}`;
    }
};

