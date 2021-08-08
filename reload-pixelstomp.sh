git pull
docker build -t pixelstomp .
docker stop pixelstomp
docker rm pixelstomp
docker run -d -p 8080:8080 --name pixelstomp pixelstomp

