import bcrypt from 'bcryptjs';
export const hashPassword = async (password) => {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
};
export const comparePassword = async (password, hash) => {
    return bcrypt.compare(password, hash);
};
//# sourceMappingURL=password.js.map