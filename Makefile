SHELL := /bin/bash

build:
	docker build --build-arg GEMFURY_TOKEN --build-arg NODE_ENV=${NODE_ENV:-development} -t bluefin .