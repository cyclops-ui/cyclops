package templates

import (
	"fmt"

	"github.com/go-redis/redis/v8"
	"golang.org/x/net/context"
)

func newRedisClient() (*redis.Client, error) {
	client := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "",
		DB:       0,
	})

	result, err := client.Ping(context.TODO()).Result()
	fmt.Println(result)
	if err != nil {
		fmt.Println("unable to connect to redis")
		return nil, err
	}

	return client, nil
}
