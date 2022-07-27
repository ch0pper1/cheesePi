#!/usr/bin/python3

#import glob
import time
import math
import paho.mqtt.client as mqtt

global mTemp, wTemp
MQTTv311 = 4

broker_address = "192.168.1.16"
client = mqtt.Client("publisher1")
client.connect(broker_address, 1883)

# get 1wire devices
base_dir = '/sys/bus/w1/devices/'
m_file = (base_dir + '28-030697799539' + '/w1_slave')
w_file = (base_dir + '28-0306977995df' + '/w1_slave')

def getTempRaw(_file):
	f = open(_file, 'r')
	lines = f.readlines()
	f.close()
	return lines

def getTemp(_file):
	lines = getTempRaw(_file)
	while lines[0].strip()[-3:] != 'YES':
		time.sleep(0.2)
		lines = getTempRaw(_file)
	equals_pos = lines[1].find('t=')
	if equals_pos != -1:
		tempString = lines[1][equals_pos+2:]
		tempC = float(tempString) / 1000.0
		tempF = round(tempC * 9.0 / 5.0 +32.0, 1)
		return tempF

while True:
	mTemp = getTemp(m_file)
	wTemp = getTemp(w_file)
	client.publish("temp/mTemp",mTemp)
	time.sleep(0.5)
	client.publish("temp/wTemp",wTemp)
	time.sleep(0.5)
