CREATE TABLE game (
  id serial PRIMARY KEY,
  home_team integer NOT NULL REFERENCES team(id),
  away_team integer NOT NULL REFERENCES team(id),
  home_score smallint,
  away_score smallint,
  started timestamp with time zone,
  CONSTRAINT positive_home_score CHECK (home_score >= 0),
  CONSTRAINT positive_away_score CHECK (away_score >= 0)
)
