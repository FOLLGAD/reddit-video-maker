build: build-hammurabi
	rm -rf bog-api/hammurabi-build
	mv hammurabi/build bog-api/hammurabi-build

build-hammurabi:
	cd hammurabi && yarn run build

install:
	cd bog-api && yarn
	cd hammurabi && yarn
