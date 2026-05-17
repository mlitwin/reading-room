.PHONY: install build serve clean

install:
	cd site/generator && npm install

build:
	cd site/generator && npm run build

serve:
	cd site/generator && npm run serve

clean:
	rm -rf docs
