import memfs from "memfs";

const tree = {
    "alpha/001-one.sql": "alpha 001",
    "alpha/002-two.sql": "alpha 002",
    "alpha/003-three.sql": "alpha 003",
    "beta/001-one.sql": "beta 001",
    "beta/002-two.sql": "beta 002",
    "beta/003-three.sql": "beta 003",
    "beta/prologue.sql": "beta prologue",
    "delta/001-one.sql": "delta 001",
    "delta/002-two.sql": "delta 002",
    "delta/003-three.sql": "delta 003",
    "delta/epilogue.sql": "delta epilogue",
    "epsilon/001-one.sql": "OK",
    "epsilon/002-two.js": "Bad - not SQL",
    "epsilon/002-two.sql": "OK",
    "epsilon/003-three.sql": "OK",
    "epsilon/epilogue.sql": "OK",
    "epsilon/prologue.sql": "OK",
    "epsilon/report.sql": "Bad - extraneous",
    "eta/001-one.sql": "1",
    "eta/003-three.sql": "3",
    "gamma/001-one.sql": "gamma 001",
    "gamma/002-two.sql": "gamma 002",
    "gamma/003-three.sql": "gamma 003",
    "gamma/epilogue.sql": "gamma epilogue",
    "gamma/prologue.sql": "gamma prologue",
    "zeta/001-one.sql": "1",
    "zeta/002-two.sql": "2",
    "zeta/002-twobis.sql": "2bis",
    "zeta/003-three.sql": "3"
};

const vfs = new memfs.Volume();
vfs.mountSync("/test", tree);
if (!vfs.existsSync("/test/alpha")) {
    vfs.mkdirSync("/test/alpha");
}
if (!vfs.existsSync("/test/beta")) {
    vfs.mkdirSync("/test/beta");
}
if (!vfs.existsSync("/test/gamma")) {
    vfs.mkdirSync("/test/gamma");
}
if (!vfs.existsSync("/test/delta")) {
    vfs.mkdirSync("/test/delta");
}
if (!vfs.existsSync("/test/epsilon")) {
    vfs.mkdirSync("/test/epsilon");
}
if (!vfs.existsSync("/test/zeta")) {
    vfs.mkdirSync("/test/zeta");
}
if (!vfs.existsSync("/test/eta")) {
    vfs.mkdirSync("/test/eta");
}
export default vfs;
