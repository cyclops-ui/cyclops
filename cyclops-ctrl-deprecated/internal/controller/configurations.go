package controller

import (
	"fmt"
	"github.com/pkg/errors"
	"gitops/internal/cluster"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"gitops/internal/mapper"
	"gitops/internal/models"
	"gitops/internal/storage"
)

type ConfigurationController struct {
	configRepo *cluster.ConfigRepo
	store      *storage.Storage
}

func NewConfigurationController() (*ConfigurationController, error) {
	//store, err := storage.New()
	//if err != nil {
	//	return nil, err
	//}

	configRepo, err := cluster.NewConfigRepo()
	if err != nil {
		return nil, err
	}

	return &ConfigurationController{
		configRepo: configRepo,
	}, nil
}

func (c *ConfigurationController) StoreConfiguration(ctx *gin.Context) {
	var reqData models.ConfigSpec

	if err := ctx.BindJSON(&reqData); err != nil {
		fmt.Println("error binding request", reqData)
		ctx.Status(http.StatusBadRequest)
		return
	}

	reqData.Created = time.Now().Format(time.RFC822)
	reqData.Edited = time.Now().Format(time.RFC822)

	if err := c.store.StoreConfig(reqData.Name, reqData); err != nil {
		fmt.Println("error storing config data", reqData)
		ctx.Status(http.StatusBadRequest)
		return
	}

	ctx.Header("Access-Control-Allow-Origin", "*")
	ctx.Status(http.StatusOK)
}

func (c *ConfigurationController) GetConfiguration(ctx *gin.Context) {
	config, err := c.store.GetConfig(ctx.Param("name"))
	if err != nil {
		fmt.Println("error fetching config")
		ctx.Status(http.StatusBadRequest)
		return
	}

	ctx.Header("Access-Control-Allow-Origin", "*")
	ctx.JSON(http.StatusOK, config)
}

func (c *ConfigurationController) GetConfigurationsDetails(ctx *gin.Context) {
	configs, err := c.store.ListConfigs()
	if err != nil {
		fmt.Println("error fetching configs")
		ctx.Status(http.StatusBadRequest)
		return
	}

	ctx.Header("Access-Control-Allow-Origin", "*")
	ctx.JSON(http.StatusOK, mapper.MapConfigDetails(configs))
}

func (c *ConfigurationController) GetK8sCyclopsConfig(ctx *gin.Context) {
	cyclopsConfig, err := c.configRepo.GetConfig(ctx.Param("name"))
	if err != nil {
		ctx.AbortWithError(http.StatusInternalServerError, errors.Wrap(err, "error fetching config"))
		fmt.Println("error", err)
		return
	}

	ctx.Header("Access-Control-Allow-Origin", "*")
	ctx.JSON(http.StatusOK, cyclopsConfig)
}

func (c *ConfigurationController) PutK8sCyclopsConfig(ctx *gin.Context) {
	var reqData models.ConfigSpec

	if err := ctx.BindJSON(&reqData); err != nil {
		fmt.Println("error binding request", reqData)
		ctx.Status(http.StatusBadRequest)
		return
	}

	reqData.Created = time.Now().Format(time.RFC822)
	reqData.Edited = time.Now().Format(time.RFC822)

	if err := c.configRepo.PutConfig(reqData); err != nil {
		fmt.Println("error storing configs", err)
		ctx.Status(http.StatusBadRequest)
		return
	}

	ctx.Header("Access-Control-Allow-Origin", "*")
	ctx.Status(http.StatusCreated)
}

func (c *ConfigurationController) ListK8sCyclopsConfig(ctx *gin.Context) {
	configs, err := c.configRepo.ListConfigs()
	if err != nil {
		fmt.Println("error fetching configs", err)
		ctx.Status(http.StatusBadRequest)
		return
	}

	ctx.Header("Access-Control-Allow-Origin", "*")
	ctx.JSON(http.StatusOK, configs)
}