
module.exports = (config) => (req, res, next) => {
    console.log("smart http handler work")
    return next();
};

