# Tondo

Command line photo application for slothful people. it makes your life and desktop background more colorful...
It's based on Unsplash (www.unsplash.com).

Note...
The background option works well on Linux but unfortunately not in Mac Os.
Regarding windows... well... I never tried...
In case you can use `-d` option and set the desktop background manually.


```sh
# Here is where you can start...
tondo --help

# Set up a random desktop background
tondo

# Set up a random desktop background considering "cat" as a topic
tondo cat

# Download 10 random images (Does not set them as desktop background)
tondo -d

# Download 10 random car images (Does not set them as desktop background)
tondo -d car

# Download 30 car images (Does not set them as desktop background)
tondo -d car --count 30
```