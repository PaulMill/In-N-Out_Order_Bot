class UserProfile {
    constructor(name, zipCode, phone) {
        this.name = name || undefined,
        this.zip = zipCode || undefined,
        this.phone = phone || undefined,
        this.language = language || 'english'
    }
}
exports.UserProfile = UserProfile;