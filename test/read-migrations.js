import path from "path";

import Migration from "../lib/migration";
import Program from "../lib/program";
import Sequence from "../lib/sequence";
import vfs from "./fixtures/migrations.js";

describe("read-migrations", () => {
  it("reads migrations", function() {
    return Sequence.readMigrations(vfs, "/test/alpha").then(s =>
      s.programs.forEach(p => p.must.be.a(Migration))
    );
  });

  it("reads just a prologue", function() {
    return Sequence.readMigrations(vfs, "/test/beta").then(s => {
      s.programs[0].must.be.a(Program);
      s.programs[0].must.not.be.a(Migration);
      path.basename(s.programs[0].path).must.equal("prologue.sql");
      s.programs.slice(1).forEach(ea => ea.must.be.a(Migration));
    });
  });

  it("reads both meta migrations", function() {
    return Sequence.readMigrations(vfs, "/test/gamma").then(s => {
      const last = s.programs.length - 1;
      s.programs[0].must.be.a(Program);
      s.programs[0].must.not.be.a(Migration);
      path.basename(s.programs[0].path).must.equal("prologue.sql");
      s.programs.slice(1, -1).forEach(ea => ea.must.be.a(Migration));
      s.programs[last].must.be.a(Program);
      s.programs[last].must.not.be.a(Migration);
      path.basename(s.programs[last].path).must.equal("epilogue.sql");
    });
  });

  it("puts migrations in order", function() {
    return Sequence.readMigrations(vfs, "/test/gamma").then(s => {
      const lim = s.programs.length - 1;
      for (let i = 1; i < lim; i++) {
        s.programs[i].ordinal.must.equal(i);
      }
    });
  });

  it("reads just an epilogue", function() {
    return Sequence.readMigrations(vfs, "/test/delta").then(s => {
      const last = s.programs.length - 1;
      s.programs.slice(0, -1).forEach(ea => ea.must.be.a(Migration));
      s.programs[last].must.be.a(Program);
      s.programs[last].must.not.be.a(Migration);
      path.basename(s.programs[last].path).must.equal("epilogue.sql");
    });
  });

  it("ignores extraneous files", function() {
    return Sequence.readMigrations(vfs, "/test/epsilon").then(s => {
      s.programs.forEach(ea => ea.template.must.equal("OK"));
    });
  });

  it("rejects on duplicate migration ordinals", function() {
    return Sequence.readMigrations(vfs, "/test/zeta").must.reject.an(Error);
  });

  it("rejects on missing migration ordinals", function() {
    return Sequence.readMigrations(vfs, "/test/zeta").must.reject.an(Error);
  });

  it("sets paths correctly", function() {
    return Sequence.readMigrations(vfs, "/test/beta").then(s => {
      s.programs[0].path.must.equal("/test/beta/prologue.sql");
      s.programs[1].path.must.equal("/test/beta/001-one.sql");
      s.programs[2].path.must.equal("/test/beta/002-two.sql");
      s.programs[3].path.must.equal("/test/beta/003-three.sql");
    });
  });

  it("honors first parameter", function() {
    return Sequence.readMigrations(vfs, "/test/alpha", 2).then(s => {
      s.programs.length.must.equal(2);
      s.programs[0].ordinal.must.equal(2);
      s.programs[1].ordinal.must.equal(3);
    });
  });

  it("honors last parameter", function() {
    return Sequence.readMigrations(vfs, "/test/alpha", undefined, 2).then(s => {
      s.programs.length.must.equal(2);
      s.programs[0].ordinal.must.equal(1);
      s.programs[1].ordinal.must.equal(2);
    });
  });

  it("honors first and last parameters", function() {
    return Sequence.readMigrations(vfs, "/test/alpha", 2, 2).then(s => {
      s.programs.length.must.equal(1);
      s.programs[0].ordinal.must.equal(2);
    });
  });

  it("honors first with prologue", function() {
    return Sequence.readMigrations(vfs, "/test/beta", 2).then(s => {
      s.programs.length.must.equal(3);
      s.programs[0].template.must.equal("beta prologue");
      s.programs[1].ordinal.must.equal(2);
      s.programs[2].ordinal.must.equal(3);
    });
  });

  it("honors last with epilogue", function() {
    return Sequence.readMigrations(vfs, "/test/delta", undefined, 2).then(s => {
      s.programs.length.must.equal(3);
      s.programs[0].ordinal.must.equal(1);
      s.programs[1].ordinal.must.equal(2);
      s.programs[2].template.must.equal("delta epilogue");
    });
  });

  it("rejects missing migration before first", function() {
    return Sequence.readMigrations(vfs, "/test/eta", 3).must.reject.an(Error);
  });

  it("rejects missing migration after last", function() {
    return Sequence.readMigrations(
      vfs,
      "/test/eta",
      undefined,
      1
    ).must.reject.an(Error);
  });
});
