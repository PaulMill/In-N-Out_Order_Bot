class UserProfile {
    constructor(name, zipCode, phone, language) {
        this.name = name || undefined,
        this.zip = zipCode || undefined,
        this.phone = phone || undefined,
        this.language = language || 'english'
    }
}
exports.UserProfile = UserProfile;